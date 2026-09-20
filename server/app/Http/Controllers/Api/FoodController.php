<?php

namespace App\Http\Controllers\Api;

use App\Enums\FoodStatus;
use App\Enums\MealType;
use App\Enums\Session as FoodSession;
use App\Http\Controllers\Controller;
use App\Http\Resources\EatenFoodResource;
use App\Http\Resources\FoodCardResource;
use App\Http\Resources\FoodOptionResource;
use App\Models\EatenFood;
use App\Models\EatenFoodItem;
use App\Models\Food;
use App\Models\Nutrition;
use App\Models\User;
use App\Services\FuzzySearchService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;
use OpenApi\Attributes as OA;

class FoodController extends Controller
{
    public function __construct(private FuzzySearchService $fuzzySearchService) {}

    #[OA\Get(
        path: '/foods',
        summary: 'Get list of foods with filters, pagination, and sorting',
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'session', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['MORNING', 'LUNCH', 'EVENING', 'AFTERNOON'])),
            new OA\Parameter(name: 'is_veg', in: 'query', required: false, schema: new OA\Schema(type: 'integer', enum: [0, 1])),
            new OA\Parameter(name: 'price_range', in: 'query', required: false, schema: new OA\Schema(type: 'array', items: new OA\Items(type: 'number'))),
            new OA\Parameter(name: 'sort_by', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['food_name', 'price'])),
            new OA\Parameter(name: 'sort_order', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'], default: 'asc')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated list of foods'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        return $this->queryFoods($request, Food::query());
    }

    #[OA\Get(
        path: '/foods/options',
        summary: 'Search foods and return top 5 options (ID and name only)',
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Top 5 food options'),
        ]
    )]
    public function options(Request $request): JsonResponse
    {
        $search = (string) ($request->query('search') ?? '');
        $query = Food::query();

        if (trim($search) !== '') {
            $query = $this->fuzzySearchService->applyQueryFilter($query, $search, ['food_name', 'quip', 'sub']);
            $items = $query->get();
            $sortedItems = $this->fuzzySearchService->sortBySimilarity($items, $search, ['food_name', 'quip', 'sub']);
            $top5 = $sortedItems->take(5);

            return response()->json(FoodOptionResource::collection($top5));
        }

        $items = $query->limit(5)->get();

        return response()->json(FoodOptionResource::collection($items));
    }

    #[OA\Post(
        path: '/foods',
        summary: 'Create a new food item (USER or ADMIN)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['food_name', 'is_veg'],
                properties: [
                    new OA\Property(property: 'food_name', type: 'string', example: 'Pho Bo'),
                    new OA\Property(property: 'quip', type: 'string'),
                    new OA\Property(property: 'sub', type: 'string'),
                    new OA\Property(property: 'price', type: 'number', format: 'float', example: 50000.0),
                    new OA\Property(property: 'image_url', type: 'string'),
                    new OA\Property(property: 'note', type: 'string'),
                    new OA\Property(property: 'is_veg', type: 'boolean', example: false),
                    new OA\Property(property: 'sessions', type: 'array', items: new OA\Items(type: 'string', enum: ['MORNING', 'LUNCH', 'EVENING', 'AFTERNOON'])),
                    new OA\Property(property: 'nutritions', type: 'array', items: new OA\Items(type: 'integer'), example: [1, 2, 3]),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Food created successfully'),
            new OA\Response(response: 400, description: 'Constraint violation or invalid foreign key'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'food_name' => 'required|string|max:255',
            'quip' => 'nullable|string',
            'sub' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|string|max:500',
            'note' => 'nullable|string',
            'is_veg' => 'required|boolean',
            'sessions' => 'nullable|array',
            'sessions.*' => ['nullable', new Enum(FoodSession::class)],
            'nutritions' => 'nullable|array',
            'nutritions.*' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        $userRole = $user?->role instanceof \BackedEnum ? $user->role->value : (string) $user?->role;
        $status = ($userRole === 'ADMIN') ? FoodStatus::ACTIVE : FoodStatus::PENDING;

        DB::beginTransaction();
        try {
            $foodData = $validator->safe()->except(['nutritions']);
            $foodData['submitted_by'] = $user?->user_id;
            $foodData['status'] = $status;

            $food = Food::create($foodData);

            $nutritionIds = $request->input('nutritions', []);
            if (! empty($nutritionIds)) {
                // Ensure all nutrition IDs exist
                $validCount = Nutrition::whereIn('nutrition_id', $nutritionIds)->count();
                if ($validCount !== count($nutritionIds)) {
                    DB::rollBack();

                    return response()->json(['message' => 'Invalid nutrition ID provided'], 400);
                }
                $food->nutritions()->sync($nutritionIds);
            }

            DB::commit();
            $food->load('nutritions');

            return response()->json([
                'message' => 'Food created successfully',
                'data' => new FoodCardResource($food),
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to create food: '.$e->getMessage()], 400);
        }
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
                    new OA\Property(property: 'food_name', type: 'string'),
                    new OA\Property(property: 'quip', type: 'string'),
                    new OA\Property(property: 'sub', type: 'string'),
                    new OA\Property(property: 'price', type: 'number', format: 'float'),
                    new OA\Property(property: 'image_url', type: 'string'),
                    new OA\Property(property: 'note', type: 'string'),
                    new OA\Property(property: 'is_veg', type: 'boolean'),
                    new OA\Property(property: 'sessions', type: 'array', items: new OA\Items(type: 'string')),
                    new OA\Property(property: 'nutritions', type: 'array', items: new OA\Items(type: 'integer')),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Food updated successfully'),
            new OA\Response(response: 400, description: 'Constraint violation'),
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
            'food_name' => 'nullable|string|max:255',
            'quip' => 'nullable|string',
            'sub' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|string|max:500',
            'note' => 'nullable|string',
            'is_veg' => 'nullable|boolean',
            'sessions' => 'nullable|array',
            'sessions.*' => ['nullable', new Enum(FoodSession::class)],
            'nutritions' => 'nullable|array',
            'nutritions.*' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();
        try {
            $foodData = array_filter($validator->safe()->except(['nutritions']), fn ($v) => $v !== null);
            $food->update($foodData);

            if ($request->has('nutritions')) {
                $nutritionIds = $request->input('nutritions', []);
                if (! empty($nutritionIds)) {
                    $validCount = Nutrition::whereIn('nutrition_id', $nutritionIds)->count();
                    if ($validCount !== count($nutritionIds)) {
                        DB::rollBack();

                        return response()->json(['message' => 'Invalid nutrition ID provided'], 400);
                    }
                    $food->nutritions()->sync($nutritionIds);
                } else {
                    $food->nutritions()->detach();
                }
            }

            DB::commit();
            $food->load('nutritions');

            return response()->json([
                'message' => 'Food updated successfully',
                'data' => new FoodCardResource($food),
            ]);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to update food: '.$e->getMessage()], 400);
        }
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

        DB::beginTransaction();
        try {
            $food->nutritions()->detach();
            $food->favoriteUsers()->detach();
            $food->scannedUsers()->detach();
            $food->delete();
            DB::commit();

            return response()->json(['message' => 'Food deleted successfully']);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to delete food: '.$e->getMessage()], 400);
        }
    }

    #[OA\Put(
        path: '/foods/{foodId}/change-status',
        summary: 'Change food status (ADMIN or MODERATOR)',
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

        return response()->json(['message' => 'Food status updated successfully']);
    }

    #[OA\Get(
        path: '/foods/gacha',
        summary: 'Random gacha food recommendations',
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'num', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'session', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['MORNING', 'LUNCH', 'EVENING', 'AFTERNOON'])),
            new OA\Parameter(name: 'is_veg', in: 'query', required: false, schema: new OA\Schema(type: 'integer', enum: [0, 1])),
            new OA\Parameter(name: 'price_range', in: 'query', required: false, schema: new OA\Schema(type: 'array', items: new OA\Items(type: 'number'))),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Random list of foods'),
        ]
    )]
    public function gacha(Request $request): JsonResponse
    {
        $num = max(1, (int) ($request->query('num') ?? 1));
        $query = Food::where('status', 'ACTIVE')->with('nutritions');

        $this->applyFilters($query, $request);

        $foods = $query->inRandomOrder()->limit($num)->get();

        return response()->json(FoodCardResource::collection($foods));
    }

    #[OA\Get(
        path: '/foods/favorite/{userId}',
        summary: 'Get favorite foods of a user (OWNER only, status ACTIVE)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Favorite foods list'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function getFavorites(Request $request, int|string $userId): JsonResponse
    {
        $user = User::find($userId);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $query = $user->favoriteFoods()->where('FOODS.status', 'ACTIVE');

        return $this->queryFoods($request, $query);
    }

    #[OA\Get(
        path: '/foods/scanned/{userId}',
        summary: 'Get scanned foods history of a user (OWNER only, status ACTIVE)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Scanned foods list'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function getScanned(Request $request, int|string $userId): JsonResponse
    {
        $user = User::find($userId);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $query = $user->scannedFoods()->where('FOODS.status', 'ACTIVE');

        return $this->queryFoods($request, $query);
    }

    #[OA\Get(
        path: '/foods/eaten/{userId}',
        summary: 'Get eaten foods history of a user (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Eaten foods list'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function getEaten(Request $request, int|string $userId): JsonResponse
    {
        $page = (int) ($request->query('page') ?? 1);
        $pageSize = (int) ($request->query('pageSize') ?? $request->query('page-size') ?? $request->query('page_size') ?? 10);
        $search = (string) ($request->query('search') ?? '');
        $sortBy = $request->query('sort_by') ?? $request->query('sort-by');
        $sortOrder = strtolower($request->query('sort_order') ?? $request->query('sort-order') ?? 'asc');

        $query = EatenFood::where('user_id', $userId)->with(['items.food.nutritions']);

        if ($sortBy && in_array($sortBy, ['eaten_at', 'meal_type'])) {
            $query->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('eaten_at', 'desc');
        }

        if (trim($search) !== '') {
            $allEaten = $query->get();
            $sortedItems = $allEaten->map(function ($eaten) use ($search) {
                $maxScore = 0.0;
                foreach ($eaten->items as $item) {
                    if ($item->food) {
                        $s1 = FuzzySearchService::computeSimilarity($search, $item->food->food_name);
                        $s2 = FuzzySearchService::computeSimilarity($search, $item->food->quip);
                        $s3 = FuzzySearchService::computeSimilarity($search, $item->food->sub);
                        $maxScore = max($maxScore, $s1, $s2, $s3);
                    }
                }
                $eaten->_similarity_score = $maxScore;

                return $eaten;
            })->filter(fn ($item) => $item->_similarity_score > 0)->sortByDesc('_similarity_score')->values();

            $totalRecords = EatenFood::count();
            $pagedItems = $sortedItems->slice(($page - 1) * $pageSize, $pageSize)->values();

            return response()->json([
                'data' => EatenFoodResource::collection($pagedItems),
                'total_records' => $totalRecords,
            ]);
        }

        $totalRecords = EatenFood::count();
        $items = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => EatenFoodResource::collection($items),
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
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Added to favorites'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Food not found'),
        ]
    )]
    public function addFavorite(Request $request): JsonResponse
    {
        $user = $request->user();
        $foodId = $request->input('food_id') ?? $request->input('foodId');

        $food = Food::find($foodId);
        if (! $food) {
            return response()->json(['message' => 'Food not found'], 404);
        }

        $user->favoriteFoods()->syncWithoutDetaching([$foodId]);

        return response()->json(['message' => 'Food added to favorites successfully']);
    }

    #[OA\Post(
        path: '/foods/scanned',
        summary: 'Add food to scanned history (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['food_id'],
                properties: [
                    new OA\Property(property: 'food_id', type: 'integer', example: 1),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Added to scanned history'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Food not found'),
        ]
    )]
    public function addScanned(Request $request): JsonResponse
    {
        $user = $request->user();
        $foodId = $request->input('food_id') ?? $request->input('foodId');

        $food = Food::find($foodId);
        if (! $food) {
            return response()->json(['message' => 'Food not found'], 404);
        }

        $user->scannedFoods()->syncWithoutDetaching([$foodId]);

        return response()->json(['message' => 'Food added to scanned history successfully']);
    }

    #[OA\Post(
        path: '/foods/eaten',
        summary: 'Record an eaten meal with food items (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['meal_type', 'items'],
                properties: [
                    new OA\Property(property: 'meal_type', type: 'string', enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
                    new OA\Property(property: 'eaten_at', type: 'string', format: 'date-time'),
                    new OA\Property(property: 'address', type: 'string'),
                    new OA\Property(property: 'note', type: 'string'),
                    new OA\Property(
                        property: 'items',
                        type: 'array',
                        items: new OA\Items(
                            properties: [
                                new OA\Property(property: 'food_id', type: 'integer', example: 1),
                                new OA\Property(property: 'quantity', type: 'number', format: 'float', example: 1.5),
                            ]
                        )
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Eaten food recorded successfully'),
            new OA\Response(response: 400, description: 'Foreign key error or invalid item'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function addEaten(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'meal_type' => ['required', new Enum(MealType::class)],
            'eaten_at' => 'nullable|date',
            'address' => 'nullable|string|max:500',
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.food_id' => 'required|integer',
            'items.*.quantity' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        DB::beginTransaction();
        try {
            $itemsData = $request->input('items');

            // Validate all food IDs exist
            $foodIds = array_column($itemsData, 'food_id');
            $validFoodCount = Food::whereIn('food_id', $foodIds)->count();
            if ($validFoodCount !== count(array_unique($foodIds))) {
                DB::rollBack();

                return response()->json(['message' => 'Invalid food ID provided in items'], 400);
            }

            $eatenFood = EatenFood::create([
                'user_id' => $user->user_id,
                'meal_type' => $request->input('meal_type'),
                'eaten_at' => $request->input('eaten_at') ?? now(),
                'address' => $request->input('address'),
                'note' => $request->input('note'),
            ]);

            foreach ($itemsData as $item) {
                EatenFoodItem::create([
                    'eaten_food_id' => $eatenFood->eaten_food_id,
                    'food_id' => $item['food_id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            DB::commit();
            $eatenFood->load('items.food.nutritions');

            return response()->json([
                'message' => 'Eaten food recorded successfully',
                'data' => new EatenFoodResource($eatenFood),
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to record eaten food: '.$e->getMessage()], 400);
        }
    }

    #[OA\Delete(
        path: '/foods/favorite',
        summary: 'Remove food from favorites via query param (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'food_id', in: 'query', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Removed from favorites'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function removeFavorite(Request $request): JsonResponse
    {
        $foodId = $request->query('food_id') ?? $request->query('food-id') ?? $request->input('food_id');
        if (! $foodId) {
            return response()->json(['message' => 'Query parameter food_id is required'], 422);
        }

        $user = $request->user();
        $user->favoriteFoods()->detach($foodId);

        return response()->json(['message' => 'Food removed from favorites successfully']);
    }

    #[OA\Delete(
        path: '/foods/eaten',
        summary: 'Delete eaten food entry via query param (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'eaten_food_id', in: 'query', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Eaten food entry deleted'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Eaten food not found'),
        ]
    )]
    public function removeEaten(Request $request): JsonResponse
    {
        $eatenFoodId = $request->query('eaten_food_id')
            ?? $request->query('eaten-food-id')
            ?? $request->input('eaten_food_id');

        if (! $eatenFoodId) {
            return response()->json(['message' => 'Query parameter eaten_food_id is required'], 422);
        }

        $eaten = EatenFood::find($eatenFoodId);
        if (! $eaten) {
            return response()->json(['message' => 'Eaten food entry not found'], 404);
        }

        $user = $request->user();
        if ((int) $eaten->user_id !== (int) $user->user_id) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        DB::beginTransaction();
        try {
            $eaten->items()->delete();
            $eaten->delete();
            DB::commit();

            return response()->json(['message' => 'Eaten food entry deleted successfully']);
        } catch (Exception $e) {
            DB::rollBack();

            return response()->json(['message' => 'Failed to delete eaten food entry: '.$e->getMessage()], 400);
        }
    }

    private function queryFoods(Request $request, $queryBuilder): JsonResponse
    {
        $page = (int) ($request->query('page') ?? 1);
        $pageSize = (int) ($request->query('pageSize') ?? $request->query('page-size') ?? $request->query('page_size') ?? 10);
        $search = (string) ($request->query('search') ?? '');

        $query = $queryBuilder->with('nutritions');

        $this->applyFilters($query, $request);

        // Sorting
        $sortBy = $request->query('sort_by') ?? $request->query('sort-by');
        $sortOrder = strtolower($request->query('sort_order') ?? $request->query('sort-order') ?? 'asc');
        if ($sortBy && in_array($sortBy, ['food_name', 'price'])) {
            $query->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc');
        }

        if (trim($search) !== '') {
            $query = $this->fuzzySearchService->applyQueryFilter($query, $search, ['food_name', 'quip', 'sub']);
            $items = $query->get();
            $sortedItems = $this->fuzzySearchService->sortBySimilarity($items, $search, ['food_name', 'quip', 'sub']);
            $totalRecords = Food::count();
            $pagedItems = $sortedItems->slice(($page - 1) * $pageSize, $pageSize)->values();

            return response()->json([
                'data' => FoodCardResource::collection($pagedItems),
                'total_records' => $totalRecords,
            ]);
        }

        $totalRecords = Food::count();
        $foods = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => FoodCardResource::collection($foods),
            'total_records' => $totalRecords,
        ]);
    }

    private function applyFilters($query, Request $request): void
    {
        // Session filter (sessions is JSON column)
        $session = $request->query('session');
        if ($session) {
            $query->whereJsonContains('sessions', $session);
        }

        // is_veg filter
        $isVeg = $request->query('is_veg') ?? $request->query('is-veg');
        if ($isVeg !== null && $isVeg !== '') {
            $query->where('is_veg', (bool) $isVeg);
        }

        // Status filter
        $status = $request->query('status');
        if ($status) {
            $query->where('status', $status);
        }

        // Price range filter
        $priceRange = $request->query('price_range') ?? $request->query('price-range');
        if (is_string($priceRange)) {
            $priceRange = explode(',', $priceRange);
        }
        if (is_array($priceRange)) {
            $minPrice = isset($priceRange[0]) && $priceRange[0] !== '' && $priceRange[0] !== null ? (float) $priceRange[0] : null;
            $maxPrice = isset($priceRange[1]) && $priceRange[1] !== '' && $priceRange[1] !== null ? (float) $priceRange[1] : null;

            if ($minPrice !== null) {
                $query->where('price', '>=', $minPrice);
            }
            if ($maxPrice !== null) {
                $query->where('price', '<=', $maxPrice);
            }
        }
    }
}
