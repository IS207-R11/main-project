<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CommunityTopic;
use App\Models\CommunityPost;
use App\Models\CommunityComment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CommunityController extends Controller
{
    // ==========================================
    // TOPICS
    // ==========================================

    public function topics(Request $request): JsonResponse
    {
        $search = $request->query('search', '');
        $query = CommunityTopic::with('creator');

        if (!empty($search)) {
            $query->where('title', 'like', "%{$search}%");
        }

        $topics = $query->orderBy('post_count', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $topics,
        ]);
    }

    public function createTopic(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|string|max:500',
            'created_by' => 'required|integer|exists:users,id',
        ]);

        // Fuzzy match / duplicate check
        $normalized = Str::lower(trim($validated['title']));
        $existing = CommunityTopic::whereRaw('LOWER(title) = ?', [$normalized])->first();

        if ($existing) {
            return response()->json([
                'status' => 'duplicate',
                'message' => 'Chủ đề tương tự đã tồn tại trên hệ thống.',
                'suggested_topic' => $existing,
            ], 409);
        }

        $slug = Str::slug($validated['title']) . '-' . Str::random(4);

        $topic = CommunityTopic::create([
            'title' => $validated['title'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'cover_image' => $validated['cover_image'] ?? null,
            'created_by' => $validated['created_by'],
            'post_count' => 0,
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $topic,
        ], 201);
    }

    // ==========================================
    // POSTS (COOKPAD STYLE)
    // ==========================================

    public function posts(Request $request): JsonResponse
    {
        $topicId = $request->query('topic_id');
        $search = $request->query('search', '');
        $excludeIngredient = $request->query('exclude', '');
        $sort = $request->query('sort', 'newest'); // newest, popular
        $limit = (int) $request->query('limit', 20);

        $query = CommunityPost::with(['author', 'topic'])
            ->where('status', 'PUBLISHED');

        if ($topicId) {
            $query->where('topic_id', $topicId);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('story', 'like', "%{$search}%")
                  ->orWhere('ingredients_json', 'like', "%{$search}%");
            });
        }

        if (!empty($excludeIngredient)) {
            $query->where('ingredients_json', 'not like', "%{$excludeIngredient}%");
        }

        if ($sort === 'popular') {
            $query->withCount('allComments')->orderBy('all_comments_count', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $posts = $query->take($limit)->get();

        return response()->json([
            'status' => 'success',
            'data' => $posts,
        ]);
    }

    public function showPost(int $id): JsonResponse
    {
        $post = CommunityPost::with([
            'author',
            'topic',
            'comments.user',
            'comments.replies.user'
        ])->where('status', 'PUBLISHED')->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $post,
        ]);
    }

    public function storePost(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic_id' => 'required|integer|exists:community_topics,id',
            'author_id' => 'required|integer|exists:users,id',
            'title' => 'required|string|max:255',
            'story' => 'nullable|string',
            'servings' => 'required|integer|min:1',
            'cook_time' => 'nullable|string|max:50',
            'ingredients' => 'required|array',
            'steps' => 'required|array',
        ]);

        $post = CommunityPost::create([
            'topic_id' => $validated['topic_id'],
            'author_id' => $validated['author_id'],
            'title' => $validated['title'],
            'story' => $validated['story'] ?? null,
            'servings' => $validated['servings'],
            'cook_time' => $validated['cook_time'] ?? '30 phút',
            'ingredients_json' => $validated['ingredients'],
            'steps_json' => $validated['steps'],
            'status' => 'PUBLISHED',
        ]);

        CommunityTopic::where('id', $validated['topic_id'])->increment('post_count');

        return response()->json([
            'status' => 'success',
            'data' => $post->load(['author', 'topic']),
        ], 201);
    }

    // ==========================================
    // COMMENTS & COOKSNAP
    // ==========================================

    public function addComment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'post_id' => 'required|integer|exists:community_posts,id',
            'user_id' => 'required|integer|exists:users,id',
            'parent_comment_id' => 'nullable|integer|exists:community_comments,id',
            'content' => 'required|string',
            'image_url' => 'nullable|array', // Cooksnap
        ]);

        $comment = CommunityComment::create([
            'post_id' => $validated['post_id'],
            'user_id' => $validated['user_id'],
            'parent_comment_id' => $validated['parent_comment_id'] ?? null,
            'content' => $validated['content'],
            'image_url' => $validated['image_url'] ?? null,
            'status' => 'PUBLISHED',
        ]);

        return response()->json([
            'status' => 'success',
            'data' => $comment->load('user'),
        ], 201);
    }
}

