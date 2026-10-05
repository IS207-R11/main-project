<?php

namespace App\Http\Controllers\Api;

use App\Enums\FoodStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\EatenFoodResource;
use App\Http\Resources\FoodCardResource;
use App\Http\Resources\FoodOptionResource;
use App\Http\Resources\UserFoodResource;
use App\Models\EatenFood;
use App\Models\FavoriteFood;
use App\Models\Food;
use App\Models\GachaFood;
use App\Models\HatedFood;
use App\Models\User;
use App\Services\FuzzySearchService;
use App\Services\JwtService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;
use OpenApi\Attributes as OA;

class FoodController extends Controller
{
    public function __construct(
        private FuzzySearchService $fuzzySearchService,
        private JwtService $jwtService
    ) {}

    #[OA\Get(
        path: '/foods',
        summary: 'Get list of foods with filters, pagination, and sorting (Public, includes favorite_count & eaten_count)',
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['ACTIVE', 'PENDING', 'DISABLED'])),
            new OA\Parameter(name: 'sort_by', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['name', 'created_at'])),
            new OA\Parameter(name: 'sort_order', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'], default: 'asc')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated list of foods'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $query = Food::with('contributor')
            ->select('FOODS.*')
            ->selectRaw('(SELECT COUNT(DISTINCT user_id) FROM FAVORITE_FOODS WHERE FAVORITE_FOODS.food_id = FOODS.food_id) as favorite_count')
            ->selectRaw('(SELECT COUNT(DISTINCT user_id) FROM EATEN_FOODS WHERE EATEN_FOODS.food_id = FOODS.food_id) as eaten_count');

        // Check auth user role if present
        $user = $request->user() ?? $request->attributes->get('auth_user');
        if (! $user && $request->bearerToken()) {
            $payload = $this->jwtService->validateAccessToken($request->bearerToken());
            if ($payload && isset($payload['user_id'])) {
                $user = User::find($payload['user_id']);
            }
        }

        $role = $user?->role instanceof \BackedEnum ? $user->role->value : (string) $user?->role;

        $statusFilter = $request->query('status');
        if (in_array($role, ['ADMIN', 'MODERATOR'], true)) {
            if ($statusFilter) {
                $query->where('status', $statusFilter);
            }
        } else {
            // Public and regular users only see ACTIVE foods
            $query->where('status', FoodStatus::ACTIVE);
        }

        return $this->queryFoods($request, $query);
    }

    #[OA\Get(
        path: '/foods/{foodId}',
        summary: 'Get food detail by ID (Public, includes favorite_count & eaten_count)',
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'foodId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Food detail with favorite_count and eaten_count'),
            new OA\Response(response: 404, description: 'Food not found'),
        ]
    )]
    public function show(int|string $foodId): JsonResponse
    {
        $food = Food::with('contributor')
            ->select('FOODS.*')
            ->selectRaw('(SELECT COUNT(DISTINCT user_id) FROM FAVORITE_FOODS WHERE FAVORITE_FOODS.food_id = FOODS.food_id) as favorite_count')
            ->selectRaw('(SELECT COUNT(DISTINCT user_id) FROM EATEN_FOODS WHERE EATEN_FOODS.food_id = FOODS.food_id) as eaten_count')
            ->find($foodId);

        if (! $food) {
            return response()->json(['message' => 'Food not found'], 404);
        }

        return (new FoodCardResource($food))->response();
    }

    #[OA\Get(
        path: '/foods/options',
        summary: 'Search foods and return top 5 options (ID and name only, Public)',
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Top 5 food options'),
        ]
    )]
    public function options(Request $request): JsonResponse
    {
        $search = (string) ($request->query('search') ?? '');
        $query = Food::where('status', FoodStatus::ACTIVE);

        if (trim($search) !== '') {
            $query = $this->fuzzySearchService->applyQueryFilter($query, $search, ['name', 'description']);
            $items = $query->get();
            $sortedItems = $this->fuzzySearchService->sortBySimilarity($items, $search, ['name', 'description']);
            $top5 = $sortedItems->take(5);

            return response()->json(FoodOptionResource::collection($top5));
        }

        $items = $query->limit(5)->get();

        return response()->json(FoodOptionResource::collection($items));
    }

    #[OA\Post(
        path: '/foods/gacha',
        summary: 'Smart Gacha API based on ranking formula, excluded lists, or foodSet',
        description: 'Rank foods by (favorites + eaten - hated), selects top 10 and returns 1 random winner.',
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'numberOfExcludedEaten', type: 'integer', example: 5),
                    new OA\Property(property: 'typeOfExcludedEaten', type: 'string', enum: ['newest', 'oldest', 'random'], default: 'newest'),
                    new OA\Property(property: 'numberOfExcludedGacha', type: 'integer', example: 3),
                    new OA\Property(property: 'typeOfExcludedGacha', type: 'string', enum: ['newest', 'oldest', 'random'], default: 'newest'),
                    new OA\Property(property: 'foodSet', type: 'array', items: new OA\Items(type: 'integer'), example: [1, 2, 3, 4, 5]),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Gacha winner food'),
            new OA\Response(response: 404, description: 'No eligible food found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function gacha(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'numberOfExcludedEaten' => 'nullable|integer|min:0',
            'typeOfExcludedEaten' => 'nullable|string|in:newest,oldest,random',
            'numberOfExcludedGacha' => 'nullable|integer|min:0',
            'typeOfExcludedGacha' => 'nullable|string|in:newest,oldest,random',
            'foodSet' => 'nullable|array',
            'foodSet.*' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Identify authenticated user if bearer token is provided
        $user = $request->user() ?? $request->attributes->get('auth_user');
        if (! $user && $request->bearerToken()) {
            $payload = $this->jwtService->validateAccessToken($request->bearerToken());
            if ($payload && isset($payload['user_id'])) {
                $user = User::find($payload['user_id']);
            }
        }

        // ==========================================
        // Bước 1: Chọn tập dữ liệu
        // ==========================================
        $query = Food::where('status', FoodStatus::ACTIVE);

        $foodSet = $request->input('foodSet') ?? $request->query('foodSet');
        if (is_string($foodSet)) {
            $foodSet = array_filter(explode(',', $foodSet), 'is_numeric');
        }

        if (! empty($foodSet) && is_array($foodSet)) {
            // Nếu foodSet được khai báo: Chọn foodSet
            $foodSetIds = array_map('intval', $foodSet);
            $query->whereIn('FOODS.food_id', $foodSetIds);
        } else {
            // Nếu không được khai báo: Chọn danh sách món ăn ngoại trừ excluded
            $excludedFoodIds = [];

            if ($user) {
                $numEaten = (int) ($request->input('numberOfExcludedEaten') ?? $request->query('numberOfExcludedEaten') ?? 0);
                $typeEaten = (string) ($request->input('typeOfExcludedEaten') ?? $request->query('typeOfExcludedEaten') ?? 'newest');

                if ($numEaten > 0) {
                    $eatenQuery = EatenFood::where('user_id', $user->user_id);
                    if ($typeEaten === 'oldest') {
                        $eatenQuery->orderBy('created_at', 'asc')->orderBy('eaten_id', 'asc');
                    } elseif ($typeEaten === 'random') {
                        $eatenQuery->inRandomOrder();
                    } else { // 'newest'
                        $eatenQuery->orderBy('created_at', 'desc')->orderBy('eaten_id', 'desc');
                    }
                    $excludedEaten = $eatenQuery->pluck('food_id')->unique()->take($numEaten)->all();
                    $excludedFoodIds = array_merge($excludedFoodIds, $excludedEaten);
                }

                $numGacha = (int) ($request->input('numberOfExcludedGacha') ?? $request->query('numberOfExcludedGacha') ?? 0);
                $typeGacha = (string) ($request->input('typeOfExcludedGacha') ?? $request->query('typeOfExcludedGacha') ?? 'newest');

                if ($numGacha > 0) {
                    $gachaQuery = GachaFood::where('user_id', $user->user_id);
                    if ($typeGacha === 'oldest') {
                        $gachaQuery->orderBy('created_at', 'asc')->orderBy('gacha_id', 'asc');
                    } elseif ($typeGacha === 'random') {
                        $gachaQuery->inRandomOrder();
                    } else { // 'newest'
                        $gachaQuery->orderBy('created_at', 'desc')->orderBy('gacha_id', 'desc');
                    }
                    $excludedGacha = $gachaQuery->pluck('food_id')->unique()->take($numGacha)->all();
                    $excludedFoodIds = array_merge($excludedFoodIds, $excludedGacha);
                }
            }

            $excludedFoodIds = array_unique($excludedFoodIds);
            if (! empty($excludedFoodIds)) {
                $query->whereNotIn('FOODS.food_id', $excludedFoodIds);
            }
        }

        // ==========================================
        // Bước 2: Xếp hạng món ăn theo công thức:
        // favorite_count + eaten_count - hated_count
        // ==========================================
        $query->select('FOODS.*')
            ->selectRaw('(SELECT COUNT(DISTINCT user_id) FROM FAVORITE_FOODS WHERE FAVORITE_FOODS.food_id = FOODS.food_id) as favorite_count')
            ->selectRaw('(SELECT COUNT(DISTINCT user_id) FROM EATEN_FOODS WHERE EATEN_FOODS.food_id = FOODS.food_id) as eaten_count')
            ->selectRaw('(SELECT COUNT(DISTINCT user_id) FROM HATED_FOODS WHERE HATED_FOODS.food_id = FOODS.food_id) as hated_count')
            ->selectRaw('((SELECT COUNT(DISTINCT user_id) FROM FAVORITE_FOODS WHERE FAVORITE_FOODS.food_id = FOODS.food_id) + (SELECT COUNT(DISTINCT user_id) FROM EATEN_FOODS WHERE EATEN_FOODS.food_id = FOODS.food_id) - (SELECT COUNT(DISTINCT user_id) FROM HATED_FOODS WHERE HATED_FOODS.food_id = FOODS.food_id)) as gacha_score')
            ->orderByDesc('gacha_score')
            ->orderByDesc('FOODS.food_id');

        // ==========================================
        // Bước 3: Lấy TOP 10 món ăn có điểm cao nhất,
        // chọn ngẫu nhiên 1 món để return
        // ==========================================
        $top10Foods = $query->limit(10)->get();

        if ($top10Foods->isEmpty()) {
            return response()->json(['message' => 'No eligible food found for gacha'], 404);
        }

        $selectedFood = $top10Foods->random();

        // Ghi nhận lượt gacha vào GACHA_FOODS nếu user đã đăng nhập
        if ($user) {
            GachaFood::create([
                'user_id' => $user->user_id,
                'food_id' => $selectedFood->food_id,
                'created_at' => now(),
            ]);
        }

        return (new FoodCardResource($selectedFood))->response();
    }

    #[OA\Put(
        path: '/foods',
        summary: 'Create a new food item (User can only PUT, default status is PENDING)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Pho Bo'),
                    new OA\Property(property: 'description', type: 'string', example: 'Vietnamese traditional beef noodle soup'),
                    new OA\Property(property: 'image_url', type: 'string', example: 'https://example.com/pho.jpg'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Food created with PENDING status'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        // Rule: User only can PUT new food, and default is PENDING
        $food = Food::create([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'image_url' => $request->input('image_url'),
            'status' => FoodStatus::PENDING,
            'contributor_id' => $user?->user_id,
        ]);

        $food->favorite_count = 0;
        $food->eaten_count = 0;

        return response()->json([
            'message' => 'Food submitted successfully and is pending approval',
            'data' => new FoodCardResource($food),
        ], 201);
    }

    #[OA\Put(
        path: '/foods/{foodId}',
        summary: 'Update a food item (ADMIN only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'foodId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string'),
                    new OA\Property(property: 'description', type: 'string'),
                    new OA\Property(property: 'image_url', type: 'string'),
                    new OA\Property(property: 'status', type: 'string', enum: ['ACTIVE', 'PENDING', 'DISABLED']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Food updated successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Food not found'),
        ]
    )]
    public function update(Request $request, int|string $foodId): JsonResponse
    {
        $food = Food::find($foodId);
        if (! $food) {
            return response()->json(['message' => 'Food not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:2048',
            'status' => ['nullable', new Enum(FoodStatus::class)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = array_filter($validator->validated(), fn ($v) => $v !== null);
        $food->update($validated);

        return response()->json([
            'message' => 'Food updated successfully',
            'data' => new FoodCardResource($food),
        ]);
    }

    #[OA\Delete(
        path: '/foods/{foodId}',
        summary: 'Delete food item (ADMIN only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'foodId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Food deleted successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Food not found'),
        ]
    )]
    public function destroy(int|string $foodId): JsonResponse
    {
        $food = Food::find($foodId);
        if (! $food) {
            return response()->json(['message' => 'Food not found'], 404);
        }

        $food->delete();

        return response()->json(['message' => 'Food deleted successfully']);
    }

    #[OA\Put(
        path: '/foods/{foodId}/change-status',
        summary: 'Approve or change food status (ADMIN or MODERATOR)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'foodId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', enum: ['ACTIVE', 'PENDING', 'DISABLED']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Food status updated successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Food not found'),
        ]
    )]
    public function changeStatus(Request $request, int|string $foodId): JsonResponse
    {
        $food = Food::find($foodId);
        if (! $food) {
            return response()->json(['message' => 'Food not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => ['required', new Enum(FoodStatus::class)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $food->status = $request->input('status');
        $food->save();

        return response()->json([
            'message' => 'Food status updated successfully',
            'data' => new FoodCardResource($food),
        ]);
    }

    // ==========================================
    // FAVORITE FOODS (Only owner user has full CRUD)
    // ==========================================

    #[OA\Get(
        path: '/foods/favorite/{userId}',
        summary: 'Get favorite foods of the logged in user (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Favorite foods list'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function getFavorites(Request $request, int|string $userId): JsonResponse
    {
        $authUser = $request->user();
        if ((int) $authUser->user_id !== (int) $userId) {
            return response()->json(['message' => 'Forbidden: You can only access your own favorite foods'], 403);
        }

        $page = (int) ($request->query('page') ?? 1);
        $pageSize = (int) ($request->query('pageSize') ?? $request->query('page-size') ?? $request->query('page_size') ?? 10);
        $search = (string) ($request->query('search') ?? '');

        $query = $authUser->favoriteFoods()->withPivot('note');

        if (trim($search) !== '') {
            $query = $this->fuzzySearchService->applyQueryFilter($query, $search, ['FOODS.name', 'FOODS.description']);
            $items = $query->get();
            $sortedItems = $this->fuzzySearchService->sortBySimilarity($items, $search, ['name', 'description']);
            $totalRecords = $authUser->favoriteFoods()->count();
            $pagedItems = $sortedItems->slice(($page - 1) * $pageSize, $pageSize)->values();

            return response()->json([
                'data' => UserFoodResource::collection($pagedItems),
                'total_records' => $totalRecords,
            ]);
        }

        $totalRecords = $authUser->favoriteFoods()->count();
        $items = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => UserFoodResource::collection($items),
            'total_records' => $totalRecords,
        ]);
    }

    #[OA\Post(
        path: '/foods/favorite',
        summary: 'Add food to favorites (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['food_id'],
                properties: [
                    new OA\Property(property: 'food_id', type: 'integer', example: 1),
                    new OA\Property(property: 'note', type: 'string', example: 'Extra spicy please'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Added to favorites'),
            new OA\Response(response: 404, description: 'Food not found'),
        ]
    )]
    public function addFavorite(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'food_id' => 'required|integer|exists:FOODS,food_id',
            'note' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $foodId = $request->input('food_id');
        $note = $request->input('note');

        $user->favoriteFoods()->syncWithoutDetaching([
            $foodId => ['note' => $note],
        ]);

        return response()->json(['message' => 'Food added to favorites successfully']);
    }

    #[OA\Put(
        path: '/foods/favorite',
        summary: 'Update favorite food note (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['food_id'],
                properties: [
                    new OA\Property(property: 'food_id', type: 'integer', example: 1),
                    new OA\Property(property: 'note', type: 'string', example: 'Updated note'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Favorite updated successfully'),
            new OA\Response(response: 404, description: 'Not in favorites'),
        ]
    )]
    public function updateFavorite(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'food_id' => 'required|integer|exists:FOODS,food_id',
            'note' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $foodId = $request->input('food_id');
        $note = $request->input('note');

        $exists = $user->favoriteFoods()->where('FOODS.food_id', $foodId)->exists();
        if (! $exists) {
            return response()->json(['message' => 'Food is not in your favorites'], 404);
        }

        $user->favoriteFoods()->updateExistingPivot($foodId, ['note' => $note]);

        return response()->json(['message' => 'Favorite updated successfully']);
    }

    #[OA\Delete(
        path: '/foods/favorite',
        summary: 'Remove food from favorites (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'food_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Removed from favorites'),
        ]
    )]
    public function removeFavorite(Request $request, int|string|null $foodId = null): JsonResponse
    {
        $targetFoodId = $foodId ?? $request->query('food_id') ?? $request->query('food-id') ?? $request->input('food_id');
        if (! $targetFoodId) {
            return response()->json(['message' => 'Parameter food_id is required'], 422);
        }

        $user = $request->user();
        $user->favoriteFoods()->detach($targetFoodId);

        return response()->json(['message' => 'Food removed from favorites successfully']);
    }

    // ==========================================
    // HATED FOODS (Only owner user has full CRUD)
    // ==========================================

    #[OA\Get(
        path: '/foods/hated/{userId}',
        summary: 'Get hated foods of the logged in user (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Hated foods list'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function getHated(Request $request, int|string $userId): JsonResponse
    {
        $authUser = $request->user();
        if ((int) $authUser->user_id !== (int) $userId) {
            return response()->json(['message' => 'Forbidden: You can only access your own hated foods'], 403);
        }

        $page = (int) ($request->query('page') ?? 1);
        $pageSize = (int) ($request->query('pageSize') ?? $request->query('page-size') ?? $request->query('page_size') ?? 10);
        $search = (string) ($request->query('search') ?? '');

        $query = $authUser->hatedFoods()->withPivot('note');

        if (trim($search) !== '') {
            $query = $this->fuzzySearchService->applyQueryFilter($query, $search, ['FOODS.name', 'FOODS.description']);
            $items = $query->get();
            $sortedItems = $this->fuzzySearchService->sortBySimilarity($items, $search, ['name', 'description']);
            $totalRecords = $authUser->hatedFoods()->count();
            $pagedItems = $sortedItems->slice(($page - 1) * $pageSize, $pageSize)->values();

            return response()->json([
                'data' => UserFoodResource::collection($pagedItems),
                'total_records' => $totalRecords,
            ]);
        }

        $totalRecords = $authUser->hatedFoods()->count();
        $items = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => UserFoodResource::collection($items),
            'total_records' => $totalRecords,
        ]);
    }

    #[OA\Post(
        path: '/foods/hated',
        summary: 'Add food to hated list (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['food_id'],
                properties: [
                    new OA\Property(property: 'food_id', type: 'integer', example: 1),
                    new OA\Property(property: 'note', type: 'string', example: 'Allergic to peanuts'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Added to hated foods'),
            new OA\Response(response: 404, description: 'Food not found'),
        ]
    )]
    public function addHated(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'food_id' => 'required|integer|exists:FOODS,food_id',
            'note' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $foodId = $request->input('food_id');
        $note = $request->input('note');

        $user->hatedFoods()->syncWithoutDetaching([
            $foodId => ['note' => $note],
        ]);

        return response()->json(['message' => 'Food added to hated list successfully']);
    }

    #[OA\Put(
        path: '/foods/hated',
        summary: 'Update hated food note (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['food_id'],
                properties: [
                    new OA\Property(property: 'food_id', type: 'integer', example: 1),
                    new OA\Property(property: 'note', type: 'string', example: 'Updated note'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Hated note updated'),
            new OA\Response(response: 404, description: 'Not in hated list'),
        ]
    )]
    public function updateHated(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'food_id' => 'required|integer|exists:FOODS,food_id',
            'note' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $foodId = $request->input('food_id');
        $note = $request->input('note');

        $exists = $user->hatedFoods()->where('FOODS.food_id', $foodId)->exists();
        if (! $exists) {
            return response()->json(['message' => 'Food is not in your hated list'], 404);
        }

        $user->hatedFoods()->updateExistingPivot($foodId, ['note' => $note]);

        return response()->json(['message' => 'Hated food note updated successfully']);
    }

    #[OA\Delete(
        path: '/foods/hated',
        summary: 'Remove food from hated list (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'food_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Removed from hated list'),
        ]
    )]
    public function removeHated(Request $request, int|string|null $foodId = null): JsonResponse
    {
        $targetFoodId = $foodId ?? $request->query('food_id') ?? $request->query('food-id') ?? $request->input('food_id');
        if (! $targetFoodId) {
            return response()->json(['message' => 'Parameter food_id is required'], 422);
        }

        $user = $request->user();
        $user->hatedFoods()->detach($targetFoodId);

        return response()->json(['message' => 'Food removed from hated list successfully']);
    }

    // ==========================================
    // EATEN FOODS (Only owner user has full CRUD)
    // ==========================================

    #[OA\Get(
        path: '/foods/eaten/{userId}',
        summary: 'Get eaten foods history of the logged in user (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort_order', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'], default: 'desc')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Eaten foods list'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 403, description: 'Forbidden'),
        ]
    )]
    public function getEaten(Request $request, int|string $userId): JsonResponse
    {
        $authUser = $request->user();
        if ((int) $authUser->user_id !== (int) $userId) {
            return response()->json(['message' => 'Forbidden: You can only access your own eaten foods'], 403);
        }

        $page = (int) ($request->query('page') ?? 1);
        $pageSize = (int) ($request->query('pageSize') ?? $request->query('page-size') ?? $request->query('page_size') ?? 10);
        $search = (string) ($request->query('search') ?? '');
        $sortOrder = strtolower($request->query('sort_order') ?? $request->query('sort-order') ?? 'desc');

        $query = EatenFood::where('user_id', $userId)->with('food');
        $query->orderBy('created_at', $sortOrder === 'asc' ? 'asc' : 'desc');

        if (trim($search) !== '') {
            $allEaten = $query->get();
            $sortedItems = $allEaten->map(function ($eaten) use ($search) {
                $score = 0.0;
                if ($eaten->food) {
                    $s1 = FuzzySearchService::computeSimilarity($search, $eaten->food->name);
                    $s2 = FuzzySearchService::computeSimilarity($search, $eaten->food->description);
                    $s3 = FuzzySearchService::computeSimilarity($search, $eaten->note);
                    $score = max($s1, $s2, $s3);
                } else {
                    $score = FuzzySearchService::computeSimilarity($search, $eaten->note);
                }
                $eaten->_similarity_score = $score;

                return $eaten;
            })->filter(fn ($item) => $item->_similarity_score > 0)->sortByDesc('_similarity_score')->values();

            $totalRecords = EatenFood::where('user_id', $userId)->count();
            $pagedItems = $sortedItems->slice(($page - 1) * $pageSize, $pageSize)->values();

            return response()->json([
                'data' => EatenFoodResource::collection($pagedItems),
                'total_records' => $totalRecords,
            ]);
        }

        $totalRecords = EatenFood::where('user_id', $userId)->count();
        $items = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => EatenFoodResource::collection($items),
            'total_records' => $totalRecords,
        ]);
    }

    #[OA\Post(
        path: '/foods/eaten',
        summary: 'Record an eaten food entry (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['food_id'],
                properties: [
                    new OA\Property(property: 'food_id', type: 'integer', example: 1),
                    new OA\Property(property: 'note', type: 'string', example: 'Ate for dinner with friends'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Eaten food recorded successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function addEaten(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'food_id' => 'required|integer|exists:FOODS,food_id',
            'note' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        $eatenFood = EatenFood::create([
            'user_id' => $user->user_id,
            'food_id' => $request->input('food_id'),
            'note' => $request->input('note'),
            'created_at' => now(),
        ]);

        $eatenFood->load('food');

        return response()->json([
            'message' => 'Eaten food recorded successfully',
            'data' => new EatenFoodResource($eatenFood),
        ], 201);
    }

    #[OA\Put(
        path: '/foods/eaten/{eatenId}',
        summary: 'Update an eaten food record (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'eatenId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'food_id', type: 'integer', example: 1),
                    new OA\Property(property: 'note', type: 'string', example: 'Updated note'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Eaten food entry updated'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Entry not found'),
        ]
    )]
    public function updateEaten(Request $request, int|string $eatenId): JsonResponse
    {
        $eaten = EatenFood::find($eatenId);
        if (! $eaten) {
            return response()->json(['message' => 'Eaten food entry not found'], 404);
        }

        $user = $request->user();
        if ((int) $eaten->user_id !== (int) $user->user_id) {
            return response()->json(['message' => 'Forbidden: You can only edit your own eaten food records'], 403);
        }

        $validator = Validator::make($request->all(), [
            'food_id' => 'nullable|integer|exists:FOODS,food_id',
            'note' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->has('food_id')) {
            $eaten->food_id = $request->input('food_id');
        }
        if ($request->has('note')) {
            $eaten->note = $request->input('note');
        }

        $eaten->save();
        $eaten->load('food');

        return response()->json([
            'message' => 'Eaten food entry updated successfully',
            'data' => new EatenFoodResource($eaten),
        ]);
    }

    #[OA\Delete(
        path: '/foods/eaten/{eatenId}',
        summary: 'Delete eaten food entry (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'eatenId', in: 'path', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'eaten_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Eaten food entry deleted'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Eaten food not found'),
        ]
    )]
    public function removeEaten(Request $request, int|string|null $eatenId = null): JsonResponse
    {
        $targetId = $eatenId
            ?? $request->query('eaten_id')
            ?? $request->query('eaten-id')
            ?? $request->input('eaten_id');

        if (! $targetId) {
            return response()->json(['message' => 'Parameter eaten_id is required'], 422);
        }

        $eaten = EatenFood::find($targetId);
        if (! $eaten) {
            return response()->json(['message' => 'Eaten food entry not found'], 404);
        }

        $user = $request->user();
        if ((int) $eaten->user_id !== (int) $user->user_id) {
            return response()->json(['message' => 'Forbidden: You can only delete your own eaten food records'], 403);
        }

        $eaten->delete();

        return response()->json(['message' => 'Eaten food entry deleted successfully']);
    }

    private function queryFoods(Request $request, $queryBuilder): JsonResponse
    {
        $page = (int) ($request->query('page') ?? 1);
        $pageSize = (int) ($request->query('pageSize') ?? $request->query('page-size') ?? $request->query('page_size') ?? 10);
        $search = (string) ($request->query('search') ?? '');

        // Sorting
        $sortBy = $request->query('sort_by') ?? $request->query('sort-by');
        $sortOrder = strtolower($request->query('sort_order') ?? $request->query('sort-order') ?? 'asc');
        if ($sortBy && in_array($sortBy, ['name', 'created_at'])) {
            $queryBuilder->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc');
        } else {
            $queryBuilder->orderBy('food_id', 'desc');
        }

        if (trim($search) !== '') {
            $query = $this->fuzzySearchService->applyQueryFilter($queryBuilder, $search, ['name', 'description']);
            $items = $query->get();
            $sortedItems = $this->fuzzySearchService->sortBySimilarity($items, $search, ['name', 'description']);
            $totalRecords = $queryBuilder->count();
            $pagedItems = $sortedItems->slice(($page - 1) * $pageSize, $pageSize)->values();

            return response()->json([
                'data' => FoodCardResource::collection($pagedItems),
                'total_records' => $totalRecords,
            ]);
        }

        $totalRecords = $queryBuilder->count();
        $foods = $queryBuilder->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => FoodCardResource::collection($foods),
            'total_records' => $totalRecords,
        ]);
    }
}
