<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ModerationReport;
use App\Models\CommunityPost;
use App\Models\CommunityComment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ModerationController extends Controller
{
    /**
     * Submit report on a post or comment
     */
    public function report(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reporter_id' => 'required|integer|exists:users,id',
            'target_type' => 'required|string|in:POST,COMMENT',
            'target_id' => 'required|integer',
            'reason' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $report = ModerationReport::create([
            'reporter_id' => $validated['reporter_id'],
            'target_type' => $validated['target_type'],
            'target_id' => $validated['target_id'],
            'reason' => $validated['reason'],
            'description' => $validated['description'] ?? null,
            'status' => 'PENDING',
        ]);

        // Auto-hide rule: If target has >= 3 distinct reports, set status to HIDDEN
        $reportCount = ModerationReport::where('target_type', $validated['target_type'])
            ->where('target_id', $validated['target_id'])
            ->distinct('reporter_id')
            ->count('reporter_id');

        if ($reportCount >= 3) {
            if ($validated['target_type'] === 'POST') {
                CommunityPost::where('id', $validated['target_id'])->update(['status' => 'HIDDEN']);
            } elseif ($validated['target_type'] === 'COMMENT') {
                CommunityComment::where('id', $validated['target_id'])->update(['status' => 'HIDDEN']);
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Báo cáo vi phạm đã được ghi nhận và gửi đến ban quản trị.',
            'data' => $report,
        ], 201);
    }

    /**
     * Admin: View moderation queue sorted by report count
     */
    public function queue(Request $request): JsonResponse
    {
        $reports = ModerationReport::with(['reporter', 'reviewer'])
            ->where('status', 'PENDING')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $reports,
        ]);
    }

    /**
     * Admin: Resolve or dismiss report, or ban user
     */
    public function resolve(Request $request, int $reportId): JsonResponse
    {
        $validated = $request->validate([
            'admin_id' => 'required|integer|exists:users,id',
            'action' => 'required|string|in:RESOLVE,DISMISS,DELETE_TARGET,BAN_USER',
        ]);

        $report = ModerationReport::findOrFail($reportId);
        $action = $validated['action'];

        if ($action === 'DELETE_TARGET') {
            if ($report->target_type === 'POST') {
                CommunityPost::where('id', $report->target_id)->update(['status' => 'DELETED']);
            } elseif ($report->target_type === 'COMMENT') {
                CommunityComment::where('id', $report->target_id)->update(['status' => 'DELETED']);
            }
            $report->update(['status' => 'RESOLVED', 'reviewed_by' => $validated['admin_id']]);
        } elseif ($action === 'BAN_USER') {
            $authorId = null;
            if ($report->target_type === 'POST') {
                $post = CommunityPost::find($report->target_id);
                $authorId = $post?->author_id;
                $post?->update(['status' => 'DELETED']);
            } elseif ($report->target_type === 'COMMENT') {
                $cmt = CommunityComment::find($report->target_id);
                $authorId = $cmt?->user_id;
                $cmt?->update(['status' => 'DELETED']);
            }

            if ($authorId) {
                User::where('id', $authorId)->update(['status' => 'BANNED']);
            }
            $report->update(['status' => 'RESOLVED', 'reviewed_by' => $validated['admin_id']]);
        } elseif ($action === 'RESOLVE') {
            $report->update(['status' => 'RESOLVED', 'reviewed_by' => $validated['admin_id']]);
        } else {
            $report->update(['status' => 'DISMISSED', 'reviewed_by' => $validated['admin_id']]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $report,
        ]);
    }
}

