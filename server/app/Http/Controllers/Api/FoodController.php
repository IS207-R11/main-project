<?php

namespace App\Http\Controllers\Api;

use App\Enums\FoodStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\EatenFoodResource;
use App\Http\Resources\FoodCardResource;
use App\Http\Resources\UserFoodResource;
use App\Models\EatenFood;
use App\Models\Food;
use App\Models\GachaFood;
use App\Models\User;
use App\Services\FuzzySearchService;
use App\Services\JwtService;
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
        summary: 'Get list of foods with filters, pagination, and sorting from V_FOODS_RANKED',
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['ALL', 'ACTIVE', 'PENDING', 'DISABLED'])),
            new OA\Parameter(name: 'sort_by', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['name', 'created_at', 'rating_score', 'cd', 'food_rank'])),
            new OA\Parameter(name: 'sort_order', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'], default: 'asc')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Paginated list of foods from V_FOODS_RANKED with total records in table',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(
                            properties: [
                                new OA\Property(property: 'food_id', type: 'integer', example: 1),
                                new OA\Property(property: 'name', type: 'string', example: 'Phở Bò'),
                                new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Phở bò truyền thống'),
                                new OA\Property(property: 'image_url', type: 'string', nullable: true, example: 'https://res.cloudinary.com/...'),
                                new OA\Property(property: 'status', type: 'string', example: 'ACTIVE'),
                                new OA\Property(property: 'created_at', type: 'string', nullable: true, example: '2026-03-01 12:00:00'),
                                new OA\Property(property: 'contributor_id', type: 'integer', nullable: true, example: 1),
                                new OA\Property(property: 'rating_score', type: 'number', format: 'float', nullable: true, example: 12.5),
                                new OA\Property(property: 'cd', type: 'number', format: 'float', nullable: true, example: 0.04),
                                new OA\Property(property: 'food_rank', type: 'string', enum: ['SSR', 'SR', 'UC', 'C'], example: 'SSR'),
                                new OA\Property(property: 'is_favorited', type: 'boolean', example: false),
                                new OA\Property(property: 'is_hated', type: 'boolean', example: false),
                            ]
                        )),
                        new OA\Property(property: 'total_records', type: 'integer', example: 120),
                    ]
                )
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        // Check auth user role if present
        $user = $request->user() ?? $request->attributes->get('auth_user');
        if (! $user && $request->bearerToken()) {
            $payload = $this->jwtService->validateAccessToken($request->bearerToken());
            if ($payload && isset($payload['user_id'])) {
                $user = User::find($payload['user_id']);
            }
        }

        $query = DB::table('FOODS as f')
            ->leftJoin('V_FOODS_RANKED as v', 'f.food_id', '=', 'v.food_id')
            ->select([
                'f.food_id',
                'f.name',
                'f.description',
                'f.image_url',
                'f.status',
                'f.created_at',
                'f.contributor_id',
                'f.rating_score',
                'v.cd',
                DB::raw("COALESCE(v.food_rank, 'C') as food_rank"),
            ]);

        $statusFilter = $request->query('status');
        if ($statusFilter !== null && trim((string) $statusFilter) !== '') {
            $upperStatus = strtoupper(trim((string) $statusFilter));
            if ($upperStatus !== 'ALL') {
                $query->where('f.status', $upperStatus);
            }
        } else {
            $query->where('f.status', FoodStatus::ACTIVE->value);
        }

        return $this->queryFoods($request, $query);
    }

    #[OA\Post(
        path: '/foods/gacha',
        summary: 'Smart Gacha API based on V_FOODS_RANKED',
        description: 'Picks winner from top 10 ranked foods in V_FOODS_RANKED according to rating_score/cd.',
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'numberOfExcludedEaten', type: 'integer', example: 5),
                    new OA\Property(property: 'typeOfExcludedEaten', type: 'string', enum: ['newest', 'oldest', 'random'], default: 'newest'),
                    new OA\Property(property: 'excludedGachaSet', type: 'boolean', example: false),
                    new OA\Property(property: 'foodSet', type: 'array', items: new OA\Items(type: 'integer'), example: [1, 2, 3, 4, 5]),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Gacha winner food from V_FOODS_RANKED',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', properties: [
                            new OA\Property(property: 'food_id', type: 'integer', example: 1),
                            new OA\Property(property: 'name', type: 'string', example: 'Phở Bò'),
                            new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Phở bò truyền thống'),
                            new OA\Property(property: 'image_url', type: 'string', nullable: true, example: 'https://res.cloudinary.com/...'),
                            new OA\Property(property: 'status', type: 'string', example: 'ACTIVE'),
                            new OA\Property(property: 'created_at', type: 'string', nullable: true, example: '2026-03-01 12:00:00'),
                            new OA\Property(property: 'contributor_id', type: 'integer', nullable: true, example: 1),
                            new OA\Property(property: 'rating_score', type: 'number', format: 'float', nullable: true, example: 12.5),
                            new OA\Property(property: 'cd', type: 'number', format: 'float', nullable: true, example: 0.04),
                            new OA\Property(property: 'food_rank', type: 'string', enum: ['SSR', 'SR', 'UC', 'C'], example: 'SSR'),
                            new OA\Property(property: 'is_favorited', type: 'boolean', example: false),
                            new OA\Property(property: 'is_hated', type: 'boolean', example: false),
                        ], type: 'object'),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'No eligible food found'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function gacha(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'numberOfExcludedEaten' => 'nullable|integer|min:0',
            'typeOfExcludedEaten' => 'nullable|string|in:newest,oldest,random',
            'excludedGachaSet' => 'nullable|boolean',
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
        // Chọn tập dữ liệu từ V_FOODS_RANKED
        // ==========================================
        $query = DB::table('V_FOODS_RANKED');

        $foodSet = $request->input('foodSet') ?? $request->query('foodSet');
        if (is_string($foodSet)) {
            $foodSet = array_filter(explode(',', $foodSet), 'is_numeric');
        }

        if (! empty($foodSet) && is_array($foodSet)) {
            $foodSetIds = array_map('intval', $foodSet);
            $query->whereIn('food_id', $foodSetIds);
        } else {
            $excludedFoodIds = [];

            if ($user) {
                $numEaten = (int) ($request->input('numberOfExcludedEaten') ?? $request->query('numberOfExcludedEaten') ?? 0);
                $typeEaten = (string) ($request->input('typeOfExcludedEaten') ?? $request->query('typeOfExcludedEaten') ?? 'newest');

                if ($numEaten > 0) {
                    $eatenQuery = EatenFood::where('user_id', $user->user_id);
                    if ($typeEaten === 'oldest') {
                        $eatenQuery->orderBy('created_at', 'asc')->orderBy('food_id', 'asc');
                    } elseif ($typeEaten === 'random') {
                        $eatenQuery->inRandomOrder();
                    } else { // 'newest'
                        $eatenQuery->orderBy('created_at', 'desc')->orderBy('food_id', 'desc');
                    }
                    $excludedEaten = $eatenQuery->pluck('food_id')->unique()->take($numEaten)->all();
                    $excludedFoodIds = array_merge($excludedFoodIds, $excludedEaten);
                }

                if ($request->boolean('excludedGachaSet')) {
                    $excludedGacha = GachaFood::where('user_id', $user->user_id)->pluck('food_id')->all();
                    $excludedFoodIds = array_merge($excludedFoodIds, $excludedGacha);
                }
            }

            $excludedFoodIds = array_unique($excludedFoodIds);
            if (! empty($excludedFoodIds)) {
                $query->whereNotIn('food_id', $excludedFoodIds);
            }
        }

        // ==========================================
        // Lấy TOP 10 món ăn có rating_score cao nhất từ view
        // ==========================================
        $top10Foods = $query->orderByDesc('rating_score')->orderBy('cd', 'asc')->limit(10)->get();

        if ($top10Foods->isEmpty()) {
            return response()->json(['message' => 'No eligible food found for gacha'], 404);
        }

        $selectedFood = $top10Foods->random();

        // Ghi nhận lượt gacha vào GACHA_FOODS nếu user đã đăng nhập
        if ($user) {
            DB::table('GACHA_FOODS')->upsert(
                [
                    'user_id' => $user->user_id,
                    'food_id' => $selectedFood->food_id,
                    'created_at' => now(),
                ],
                ['user_id', 'food_id'],
                ['created_at']
            );
        }

        return (new FoodCardResource($selectedFood))->response();
    }

    #[OA\Post(
        path: '/foods/tinder',
        summary: 'Smart Tinder foods API based on V_FOODS_RANKED',
        description: 'Returns a list of foods for tinder swipe matching, filtered by exclusion rules and foodSet.',
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'numberOfExcludedEaten', type: 'integer', example: 5),
                    new OA\Property(property: 'typeOfExcludedEaten', type: 'string', enum: ['newest', 'oldest', 'random'], default: 'newest'),
                    new OA\Property(property: 'excludedGachaSet', type: 'boolean', example: false),
                    new OA\Property(property: 'numberOfResult', type: 'integer', example: 10),
                    new OA\Property(property: 'foodSet', type: 'array', items: new OA\Items(type: 'integer'), example: [1, 2, 3, 4, 5]),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of foods for tinder swipe matching',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'data', type: 'array', items: new OA\Items(
                            properties: [
                                new OA\Property(property: 'food_id', type: 'integer', example: 1),
                                new OA\Property(property: 'name', type: 'string', example: 'Phở Bò'),
                                new OA\Property(property: 'description', type: 'string', nullable: true, example: 'Phở bò truyền thống'),
                                new OA\Property(property: 'image_url', type: 'string', nullable: true, example: 'https://res.cloudinary.com/...'),
                                new OA\Property(property: 'status', type: 'string', example: 'ACTIVE'),
                                new OA\Property(property: 'created_at', type: 'string', nullable: true, example: '2026-03-01 12:00:00'),
                                new OA\Property(property: 'contributor_id', type: 'integer', nullable: true, example: 1),
                                new OA\Property(property: 'rating_score', type: 'number', format: 'float', nullable: true, example: 12.5),
                                new OA\Property(property: 'cd', type: 'number', format: 'float', nullable: true, example: 0.04),
                                new OA\Property(property: 'food_rank', type: 'string', enum: ['SSR', 'SR', 'UC', 'C'], example: 'SSR'),
                                new OA\Property(property: 'is_favorited', type: 'boolean', example: false),
                                new OA\Property(property: 'is_hated', type: 'boolean', example: false),
                            ]
                        )),
                        new OA\Property(property: 'total_records', type: 'integer', example: 10),
                    ]
                )
            ),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function tinder(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'numberOfExcludedEaten' => 'nullable|integer|min:0',
            'typeOfExcludedEaten' => 'nullable|string|in:newest,oldest,random',
            'excludedGachaSet' => 'nullable|boolean',
            'numberOfResult' => 'nullable|integer|min:1|max:100',
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
                if ($user) {
                    $request->setUserResolver(fn () => $user);
                    $request->attributes->set('auth_user', $user);
                }
            }
        }

        // ==========================================
        // Chọn tập dữ liệu từ V_FOODS_RANKED
        // ==========================================
        $query = DB::table('V_FOODS_RANKED');

        $foodSet = $request->input('foodSet') ?? $request->query('foodSet');
        if (is_string($foodSet)) {
            $foodSet = array_filter(explode(',', $foodSet), 'is_numeric');
        }

        if (! empty($foodSet) && is_array($foodSet)) {
            $foodSetIds = array_map('intval', $foodSet);
            $query->whereIn('food_id', $foodSetIds);
        } else {
            $excludedFoodIds = [];

            if ($user) {
                $numEaten = (int) ($request->input('numberOfExcludedEaten') ?? $request->query('numberOfExcludedEaten') ?? 0);
                $typeEaten = (string) ($request->input('typeOfExcludedEaten') ?? $request->query('typeOfExcludedEaten') ?? 'newest');

                if ($numEaten > 0) {
                    $eatenQuery = EatenFood::where('user_id', $user->user_id);
                    if ($typeEaten === 'oldest') {
                        $eatenQuery->orderBy('created_at', 'asc')->orderBy('food_id', 'asc');
                    } elseif ($typeEaten === 'random') {
                        $eatenQuery->inRandomOrder();
                    } else { // 'newest'
                        $eatenQuery->orderBy('created_at', 'desc')->orderBy('food_id', 'desc');
                    }
                    $excludedEaten = $eatenQuery->pluck('food_id')->unique()->take($numEaten)->all();
                    $excludedFoodIds = array_merge($excludedFoodIds, $excludedEaten);
                }

                if ($request->boolean('excludedGachaSet')) {
                    $excludedGacha = GachaFood::where('user_id', $user->user_id)->pluck('food_id')->all();
                    $excludedFoodIds = array_merge($excludedFoodIds, $excludedGacha);
                }
            }

            $excludedFoodIds = array_unique($excludedFoodIds);
            if (! empty($excludedFoodIds)) {
                $query->whereNotIn('food_id', $excludedFoodIds);
            }
        }

        $numberOfResult = (int) ($request->input('numberOfResult') ?? $request->query('numberOfResult') ?? 10);
        $foods = $query->inRandomOrder()->limit($numberOfResult)->get();

        return response()->json([
            'data' => FoodCardResource::collection($foods),
            'total_records' => $foods->count(),
        ]);
    }

    #[OA\Put(
        path: '/foods',
        summary: 'Create a new food item (User can only PUT, default status is PENDING)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name', 'description', 'image_url'],
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
            'description' => 'required|string',
            'image_url' => 'required_without:image|nullable|string|max:2048',
            'image' => [
                'required_without:image_url',
                'nullable',
                'file',
                'image',
                'mimes:jpeg,png,jpg,webp,gif,svg,avif',
                'max:5120',
            ],
        ], [
            'name.required' => 'Vui lòng nhập tên món ăn.',
            'description.required' => 'Vui lòng nhập mô tả món ăn.',
            'image_url.required_without' => 'Vui lòng cung cấp URL hình ảnh hoặc tải lên file ảnh.',
            'image.required_without' => 'Vui lòng cung cấp URL hình ảnh hoặc tải lên file ảnh.',
            'image.image' => 'File tải lên bắt buộc phải là định dạng hình ảnh.',
            'image.mimes' => 'Hình ảnh chỉ chấp nhận các định dạng: jpeg, png, jpg, webp, gif, svg, avif.',
            'image.max' => 'Kích thước ảnh phải dưới 5MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $imageUrl = $request->input('image_url');

        if ($request->hasFile('image')) {
            $imageFile = $request->file('image');
            if ($imageFile->getSize() >= 5 * 1024 * 1024) {
                return response()->json([
                    'message' => 'Kích thước ảnh phải dưới 5MB.',
                    'errors' => ['image' => ['Kích thước ảnh vượt quá giới hạn 5MB.']],
                ], 422);
            }

            try {
                $folder = 'foods';
                $uploadPreset = config('cloudinary.upload_preset');
                $options = ['folder' => $folder, 'resource_type' => 'image'];
                if (! empty($uploadPreset)) {
                    $options['upload_preset'] = $uploadPreset;
                }

                $uploadResult = cloudinary()->uploadApi()->upload($imageFile->getRealPath(), $options);
                $imageUrl = $uploadResult['secure_url'] ?? $uploadResult['url'] ?? $imageUrl;
            } catch (\Throwable $e) {
                $isConfigError = str_contains($e->getMessage(), 'Invalid configuration') ||
                                 str_contains($e->getMessage(), 'please set up your environment');

                if ($isConfigError) {
                    try {
                        $path = $imageFile->store('foods', 'public');
                        $imageUrl = url('storage/'.$path);
                    } catch (\Throwable $localErr) {
                        return response()->json([
                            'message' => 'Lỗi khi tải ảnh lên Cloudinary: '.$e->getMessage().'. Vui lòng cấu hình CLOUDINARY_URL trên Render Dashboard.',
                        ], 500);
                    }
                } else {
                    return response()->json([
                        'message' => 'Lỗi khi tải ảnh lên Cloudinary: '.$e->getMessage(),
                    ], 500);
                }
            }
        }

        if (empty($imageUrl)) {
            return response()->json([
                'message' => 'Vui lòng cung cấp hình ảnh cho món ăn (image_url hoặc file ảnh).',
                'errors' => ['image_url' => ['Hình ảnh món ăn là bắt buộc.']],
            ], 422);
        }

        $user = $request->user();

        // Rule: User only can PUT new food, and default is PENDING
        $food = Food::create([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'image_url' => $imageUrl,
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
            'name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'image_url' => 'sometimes|required|string|max:2048',
            'status' => ['nullable', new Enum(FoodStatus::class)],
        ], [
            'name.required' => 'Tên món ăn không được để trống.',
            'description.required' => 'Mô tả món ăn không được để trống.',
            'image_url.required' => 'Đường dẫn hình ảnh không được để trống.',
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
        $foodId = (int) $request->input('food_id');
        $note = $request->input('note');

        $eatenId = DB::table('EATEN_FOODS')->insertGetId([
            'user_id' => $user->user_id,
            'food_id' => $foodId,
            'note' => $note,
            'created_at' => now(),
        ]);

        $eatenFood = EatenFood::where('eaten_id', $eatenId)
            ->with('food')
            ->first();

        return response()->json([
            'message' => 'Eaten food recorded successfully',
            'data' => new EatenFoodResource($eatenFood),
        ], 201);
    }

    #[OA\Delete(
        path: '/foods/eaten/nearly',
        summary: 'Delete the most recent eaten food record (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'food_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Most recent eaten food entry deleted'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'No eaten record found to delete'),
        ]
    )]
    public function removeNearlyEaten(Request $request): JsonResponse
    {
        $user = $request->user();
        $foodId = $request->input('food_id')
            ?? $request->query('food_id')
            ?? $request->query('food-id');

        $query = EatenFood::where('user_id', $user->user_id);
        if ($foodId) {
            $query->where('food_id', (int) $foodId);
        }

        $nearly = $query->orderBy('created_at', 'desc')
            ->orderBy('eaten_id', 'desc')
            ->first();

        if (! $nearly) {
            return response()->json(['message' => 'Không tìm thấy lịch sử ăn gần nhất để xóa'], 404);
        }

        DB::table('EATEN_FOODS')
            ->where('eaten_id', $nearly->eaten_id)
            ->delete();

        return response()->json([
            'message' => 'Đã xóa lần ăn gần nhất thành công',
            'data' => [
                'eaten_id' => (int) $nearly->eaten_id,
                'food_id' => (int) $nearly->food_id,
            ],
        ], 200);
    }

    #[OA\Put(
        path: '/foods/eaten/{foodId}',
        summary: 'Update an eaten food record (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'foodId', in: 'path', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: false,
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
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Entry not found'),
        ]
    )]
    public function updateEaten(Request $request, int|string|null $foodId = null): JsonResponse
    {
        $user = $request->user();
        $targetId = $foodId
            ?? $request->input('eaten_id')
            ?? $request->query('eaten_id')
            ?? $request->input('food_id')
            ?? $request->query('food_id');

        if (! $targetId) {
            return response()->json(['message' => 'Parameter food_id or eaten_id is required'], 422);
        }

        $validator = Validator::make($request->all(), [
            'food_id' => 'nullable|integer|exists:FOODS,food_id',
            'note' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $eaten = EatenFood::where('user_id', $user->user_id)
            ->where(function ($q) use ($targetId) {
                $q->where('eaten_id', $targetId)
                    ->orWhere('food_id', $targetId);
            })
            ->first();

        if (! $eaten) {
            $existsForAnyone = EatenFood::where('eaten_id', $targetId)
                ->orWhere('food_id', $targetId)
                ->exists();
            if ($existsForAnyone) {
                return response()->json(['message' => 'Forbidden: You can only edit your own eaten food records'], 403);
            }

            return response()->json(['message' => 'Eaten food entry not found'], 404);
        }

        if ($request->has('note')) {
            $eaten->note = $request->input('note');
        }
        if ($request->has('food_id')) {
            $eaten->food_id = (int) $request->input('food_id');
        }
        $eaten->save();

        $updated = EatenFood::where('eaten_id', $eaten->eaten_id)
            ->with('food')
            ->first();

        return response()->json([
            'message' => 'Eaten food entry updated successfully',
            'data' => new EatenFoodResource($updated),
        ]);
    }

    #[OA\Delete(
        path: '/foods/eaten/{foodId}',
        summary: 'Delete eaten food entry (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Foods'],
        parameters: [
            new OA\Parameter(name: 'foodId', in: 'path', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'food_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'eaten_id', in: 'query', required: false, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Eaten food entry deleted'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 403, description: 'Forbidden'),
            new OA\Response(response: 404, description: 'Eaten food not found'),
        ]
    )]
    public function removeEaten(Request $request, int|string|null $foodId = null): JsonResponse
    {
        $targetId = $foodId
            ?? $request->query('eaten_id')
            ?? $request->query('eaten-id')
            ?? $request->input('eaten_id')
            ?? $request->query('food_id')
            ?? $request->query('food-id')
            ?? $request->input('food_id');

        if (! $targetId) {
            return response()->json(['message' => 'Parameter food_id or eaten_id is required'], 422);
        }

        $user = $request->user();
        $eaten = EatenFood::where('user_id', $user->user_id)
            ->where(function ($q) use ($targetId) {
                $q->where('eaten_id', $targetId)
                    ->orWhere('food_id', $targetId);
            })
            ->first();

        if (! $eaten) {
            $existsForAnyone = EatenFood::where('eaten_id', $targetId)
                ->orWhere('food_id', $targetId)
                ->exists();
            if ($existsForAnyone) {
                return response()->json(['message' => 'Forbidden: You can only delete your own eaten food records'], 403);
            }

            return response()->json(['message' => 'Eaten food not found'], 404);
        }

        $eaten->delete();

        return response()->json(['message' => 'Eaten food entry deleted successfully']);
    }

    private function queryFoods(Request $request, $queryBuilder): JsonResponse
    {
        $page = (int) ($request->query('page') ?? 1);
        $pageSize = (int) ($request->query('pageSize') ?? $request->query('page-size') ?? $request->query('page_size') ?? 10);
        $search = (string) ($request->query('search') ?? '');

        // Filtering by rarity / food_rank
        $foodRank = $request->query('food_rank') ?? $request->query('rarity');
        if ($foodRank && in_array(strtoupper((string) $foodRank), ['SSR', 'SR', 'UC', 'C'], true)) {
            $queryBuilder->where(DB::raw("COALESCE(v.food_rank, 'C')"), strtoupper((string) $foodRank));
        }

        // Sorting
        $sortBy = $request->query('sort_by') ?? $request->query('sort-by');
        $sortOrder = strtolower($request->query('sort_order') ?? $request->query('sort-order') ?? 'asc');
        $sortableColumns = [
            'name' => 'f.name',
            'created_at' => 'f.created_at',
            'rating_score' => 'f.rating_score',
            'cd' => 'v.cd',
            'food_rank' => 'food_rank',
            'food_id' => 'f.food_id',
        ];
        if ($sortBy && isset($sortableColumns[$sortBy])) {
            $queryBuilder->orderBy($sortableColumns[$sortBy], $sortOrder === 'desc' ? 'desc' : 'asc');
        } else {
            $queryBuilder->orderBy('f.food_id', 'desc');
        }

        if (trim($search) !== '') {
            $query = $this->fuzzySearchService->applyQueryFilter($queryBuilder, $search, ['f.name', 'f.description']);
            $items = $query->get();
            $sortedItems = $this->fuzzySearchService->sortBySimilarity($items, $search, ['name', 'description']);
            $totalRecords = $sortedItems->count();
            $pagedItems = $sortedItems->slice(($page - 1) * $pageSize, $pageSize)->values();

            return response()->json([
                'data' => FoodCardResource::collection($pagedItems),
                'total_records' => $totalRecords,
            ]);
        }

        $totalRecords = (clone $queryBuilder)->count();
        $foods = $queryBuilder->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => FoodCardResource::collection($foods),
            'total_records' => $totalRecords,
        ]);
    }
}
