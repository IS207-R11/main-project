<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemDish;
use App\Models\SystemDishIngredient;
use App\Models\NutritionIngredient;
use App\Models\UserDishInteraction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SystemDishController extends Controller
{
    /**
     * List system dishes with allergy exclusion and filters
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->query('user_id');
        $search = $request->query('search', '');
        $category = $request->query('category', '');
        $limit = (int) $request->query('limit', 20);
        $offset = (int) $request->query('offset', 0);

        $query = SystemDish::with(['ingredients']);

        // 1. User Allergy Exclusion: Filter out dishes containing ingredients the user is allergic to
        if ($userId) {
            $allergicIngredientIds = DB::table('user_allergy_ingredients')
                ->where('user_id', $userId)
                ->pluck('ingredient_id')
                ->toArray();

            if (!empty($allergicIngredientIds)) {
                $query->whereDoesntHave('ingredients', function ($q) use ($allergicIngredientIds) {
                    $q->whereIn('nutrition_ingredients.id', $allergicIngredientIds);
                });
            }

            // Exclude disliked and allergic dishes
            $blockedDishIds = DB::table('user_dish_interactions')
                ->where('user_id', $userId)
                ->whereIn('interaction_type', ['DISLIKE', 'ALLERGY'])
                ->pluck('dish_id')
                ->toArray();

            if (!empty($blockedDishIds)) {
                $query->whereNotIn('id', $blockedDishIds);
            }
        }

        // 2. Search query filter
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('instructions', 'like', "%{$search}%");
            });
        }

        // 3. Category / Nutrition filter
        if ($category === 'eat_clean') {
            $query->where('total_calo', '<=', 400);
        } elseif ($category === 'quick') {
            $query->where('instructions', 'like', '%15 phút%');
        }

        $total = $query->count();
        $dishes = $query->orderBy('favourite_count', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get();

        // Attach user interaction state if user logged in (SECURITY: NEVER return dislike_count or allergy_count)
        if ($userId) {
            $userInteractions = DB::table('user_dish_interactions')
                ->where('user_id', $userId)
                ->whereIn('dish_id', $dishes->pluck('id'))
                ->get()
                ->groupBy('dish_id');

            $dishes->each(function ($dish) use ($userInteractions) {
                $dishInts = $userInteractions->get($dish->id, collect());
                $dish->is_favourited = $dishInts->contains('interaction_type', 'FAVOURITE');
                $dish->is_disliked = $dishInts->contains('interaction_type', 'DISLIKE');
                $dish->is_allergic = $dishInts->contains('interaction_type', 'ALLERGY');
            });
        }

        return response()->json([
            'status' => 'success',
            'total' => $total,
            'data' => $dishes,
        ]);
    }

    /**
     * Show single dish by slug or ID
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $userId = $request->query('user_id');

        $dish = SystemDish::with(['ingredients'])->where('slug', $slug)
            ->orWhere('id', is_numeric($slug) ? (int)$slug : 0)
            ->firstOrFail();

        // Interactions state for current user
        if ($userId) {
            $interactions = DB::table('user_dish_interactions')
                ->where('user_id', $userId)
                ->where('dish_id', $dish->id)
                ->pluck('interaction_type')
                ->toArray();

            $dish->is_favourited = in_array('FAVOURITE', $interactions);
            $dish->is_disliked = in_array('DISLIKE', $interactions);
            $dish->is_allergic = in_array('ALLERGY', $interactions);
        }

        return response()->json([
            'status' => 'success',
            'data' => $dish,
        ]);
    }

    /**
     * Store system dish (Admin only) with auto-computed nutrition formula:
     * T = sum(Wi * (1 - Ri/100) * (Ni / 100))
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'image_url' => 'nullable|string|max:500',
            'instructions' => 'required|string',
            'source_url' => 'nullable|string|max:500',
            'ingredients' => 'required|array',
            'ingredients.*.ingredient_id' => 'required|integer|exists:nutrition_ingredients,id',
            'ingredients.*.quantity_display' => 'required|string|max:100',
            'ingredients.*.weight_in_grams' => 'required|numeric|min:0',
        ]);

        $slug = Str::slug($validated['title']) . '-' . Str::random(5);

        DB::beginTransaction();
        try {
            $dish = SystemDish::create([
                'title' => $validated['title'],
                'slug' => $slug,
                'image_url' => $validated['image_url'] ?? null,
                'instructions' => $validated['instructions'],
                'source_url' => $validated['source_url'] ?? 'https://monngonmoingay.com/',
                'total_calo' => 0.0,
            ]);

            $totalCalo = 0.0;
            foreach ($validated['ingredients'] as $ing) {
                $nutrition = NutritionIngredient::findOrFail($ing['ingredient_id']);
                $w = (float) $ing['weight_in_grams'];
                $r = (float) $nutrition->refuse_rate / 100.0;
                $n = (float) $nutrition->calo_per_100g;

                // Formula: Wi * (1 - Ri) * (Ni / 100)
                $itemCalo = $w * (1.0 - $r) * ($n / 100.0);
                $totalCalo += $itemCalo;

                SystemDishIngredient::create([
                    'dish_id' => $dish->id,
                    'ingredient_id' => $ing['ingredient_id'],
                    'quantity_display' => $ing['quantity_display'],
                    'weight_in_grams' => $w,
                ]);
            }

            $dish->update(['total_calo' => round($totalCalo, 2)]);
            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Tạo món ăn thành công với tính toán dinh dưỡng tự động.',
                'data' => $dish->load('ingredients'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * User interaction: Favourite, Dislike, Allergy
     */
    public function interact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'dish_id' => 'required|integer|exists:system_dishes,id',
            'interaction_type' => 'required|string|in:FAVOURITE,DISLIKE,ALLERGY',
            'allergy_ingredient_ids' => 'nullable|array',
        ]);

        $userId = $validated['user_id'];
        $dishId = $validated['dish_id'];
        $type = $validated['interaction_type'];

        DB::beginTransaction();
        try {
            $existing = UserDishInteraction::where('user_id', $userId)
                ->where('dish_id', $dishId)
                ->where('interaction_type', $type)
                ->first();

            if ($existing) {
                // Toggle off
                $existing->delete();
                if ($type === 'FAVOURITE') {
                    SystemDish::where('id', $dishId)->decrement('favourite_count');
                }
                $active = false;
            } else {
                // Add interaction
                UserDishInteraction::create([
                    'user_id' => $userId,
                    'dish_id' => $dishId,
                    'interaction_type' => $type,
                    'created_at' => now(),
                ]);

                if ($type === 'FAVOURITE') {
                    SystemDish::where('id', $dishId)->increment('favourite_count');
                }

                // If ALLERGY and specific ingredients provided, add to user_allergy_ingredients
                if ($type === 'ALLERGY' && !empty($validated['allergy_ingredient_ids'])) {
                    foreach ($validated['allergy_ingredient_ids'] as $ingId) {
                        DB::table('user_allergy_ingredients')->updateOrInsert([
                            'user_id' => $userId,
                            'ingredient_id' => $ingId,
                        ]);
                    }
                }

                $active = true;
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'interaction_type' => $type,
                'active' => $active,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Mini-Game 1: Tinder pre-fetch (10-20 dishes, allergic/disliked filtered out, < 200ms)
     */
    public function tinder(Request $request): JsonResponse
    {
        $userId = $request->query('user_id');

        $query = SystemDish::with(['ingredients']);

        if ($userId) {
            $allergicIngredientIds = DB::table('user_allergy_ingredients')
                ->where('user_id', $userId)
                ->pluck('ingredient_id')
                ->toArray();

            if (!empty($allergicIngredientIds)) {
                $query->whereDoesntHave('ingredients', function ($q) use ($allergicIngredientIds) {
                    $q->whereIn('nutrition_ingredients.id', $allergicIngredientIds);
                });
            }

            $blockedDishIds = DB::table('user_dish_interactions')
                ->where('user_id', $userId)
                ->whereIn('interaction_type', ['DISLIKE', 'ALLERGY'])
                ->pluck('dish_id')
                ->toArray();

            if (!empty($blockedDishIds)) {
                $query->whereNotIn('id', $blockedDishIds);
            }
        }

        $dishes = $query->inRandomOrder()->take(15)->get();

        return response()->json([
            'status' => 'success',
            'data' => $dishes,
        ]);
    }

    /**
     * Mini-Game 2: Gacha pack opening (3-5 cards, theme-based, weighted for favorites)
     */
    public function gacha(Request $request): JsonResponse
    {
        $userId = $request->input('user_id');
        $packType = $request->input('pack_type', 'random'); // breakfast, clean_eat, family, random

        $query = SystemDish::with(['ingredients']);

        if ($userId) {
            $allergicIngredientIds = DB::table('user_allergy_ingredients')
                ->where('user_id', $userId)
                ->pluck('ingredient_id')
                ->toArray();

            if (!empty($allergicIngredientIds)) {
                $query->whereDoesntHave('ingredients', function ($q) use ($allergicIngredientIds) {
                    $q->whereIn('nutrition_ingredients.id', $allergicIngredientIds);
                });
            }

            $blockedDishIds = DB::table('user_dish_interactions')
                ->where('user_id', $userId)
                ->whereIn('interaction_type', ['DISLIKE', 'ALLERGY'])
                ->pluck('dish_id')
                ->toArray();

            if (!empty($blockedDishIds)) {
                $query->whereNotIn('id', $blockedDishIds);
            }
        }

        if ($packType === 'breakfast') {
            $query->where('instructions', 'like', '%15 phút%');
        } elseif ($packType === 'clean_eat') {
            $query->where('total_calo', '<=', 400);
        } elseif ($packType === 'family') {
            $query->where('instructions', 'like', '%cơm%');
        }

        $cardCount = rand(3, 5);
        $cards = $query->inRandomOrder()->take($cardCount)->get();

        return response()->json([
            'status' => 'success',
            'pack_type' => $packType,
            'card_count' => $cards->count(),
            'data' => $cards,
        ]);
    }
}

