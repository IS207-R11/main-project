<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NutritionOptionResource;
use App\Http\Resources\NutritionResource;
use App\Models\Nutrition;
use App\Services\FuzzySearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;

class NutritionController extends Controller
{
    public function __construct(private FuzzySearchService $fuzzySearchService) {}

    #[OA\Get(
        path: '/nutritions',
        summary: 'Get list of nutritions with search and sorting',
        tags: ['Nutritions'],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort_by', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort_order', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'], default: 'asc')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated list of nutritions'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $page = (int) ($request->query('page') ?? 1);
        $pageSize = (int) ($request->query('pageSize') ?? $request->query('page-size') ?? $request->query('page_size') ?? 10);
        $search = (string) ($request->query('search') ?? '');
        $sortBy = $request->query('sort_by') ?? $request->query('sort-by');
        $sortOrder = strtolower($request->query('sort_order') ?? $request->query('sort-order') ?? 'asc');

        $query = Nutrition::query();

        $allowedSorts = [
            'nutrition_name', 'calories', 'serving_size_g', 'fat_total_g', 'fat_saturated_g',
            'fat_trans_g', 'protein_g', 'sodium_mg', 'potassium_mg', 'cholesterol_mg',
            'carbohydrates_total_g', 'fiber_g', 'sugar_g',
        ];

        if ($sortBy && in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc');
        }

        if (trim($search) !== '') {
            $query = $this->fuzzySearchService->applyQueryFilter($query, $search, ['nutrition_name']);
            $items = $query->get();
            $sortedItems = $this->fuzzySearchService->sortBySimilarity($items, $search, ['nutrition_name']);
            $totalRecords = Nutrition::count();
            $pagedItems = $sortedItems->slice(($page - 1) * $pageSize, $pageSize)->values();

            return response()->json([
                'data' => NutritionResource::collection($pagedItems),
                'total_records' => $totalRecords,
            ]);
        }

        $totalRecords = Nutrition::count();
        $nutritions = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => NutritionResource::collection($nutritions),
            'total_records' => $totalRecords,
        ]);
    }

    #[OA\Get(
        path: '/nutritions/options',
        summary: 'Search nutritions and return top 5 options (ID and name only)',
        tags: ['Nutritions'],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Top 5 nutrition options'),
        ]
    )]
    public function options(Request $request): JsonResponse
    {
        $search = (string) ($request->query('search') ?? '');
        $query = Nutrition::query();

        if (trim($search) !== '') {
            $query = $this->fuzzySearchService->applyQueryFilter($query, $search, ['nutrition_name']);
            $items = $query->get();
            $sortedItems = $this->fuzzySearchService->sortBySimilarity($items, $search, ['nutrition_name']);
            $top5 = $sortedItems->take(5);

            return response()->json(NutritionOptionResource::collection($top5));
        }

        $items = $query->limit(5)->get();

        return response()->json(NutritionOptionResource::collection($items));
    }

    #[OA\Get(
        path: '/nutritions/{nutritionId}',
        summary: 'Get details of a nutrition item',
        tags: ['Nutritions'],
        parameters: [
            new OA\Parameter(name: 'nutritionId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Nutrition details'),
            new OA\Response(response: 404, description: 'Nutrition not found'),
        ]
    )]
    public function show(int|string $nutritionId): JsonResponse
    {
        $nutrition = Nutrition::find($nutritionId);
        if (! $nutrition) {
            return response()->json(['message' => 'Nutrition not found'], 404);
        }

        return (new NutritionResource($nutrition))->response();
    }

    #[OA\Post(
        path: '/nutritions',
        summary: 'Create a new nutrition item (USER or ADMIN)',
        security: [['bearerAuth' => []]],
        tags: ['Nutritions'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['nutrition_name'],
                properties: [
                    new OA\Property(property: 'nutrition_name', type: 'string', example: 'Protein'),
                    new OA\Property(property: 'calories', type: 'number', format: 'float', example: 4.0),
                    new OA\Property(property: 'serving_size_g', type: 'number', format: 'float', example: 100.0),
                    new OA\Property(property: 'fat_total_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'fat_saturated_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'fat_trans_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'protein_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'sodium_mg', type: 'number', format: 'float'),
                    new OA\Property(property: 'potassium_mg', type: 'number', format: 'float'),
                    new OA\Property(property: 'cholesterol_mg', type: 'number', format: 'float'),
                    new OA\Property(property: 'carbohydrates_total_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'fiber_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'sugar_g', type: 'number', format: 'float'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Nutrition created successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nutrition_name' => 'required|string|max:255',
            'calories' => 'nullable|numeric|min:0',
            'serving_size_g' => 'nullable|numeric|min:0',
            'fat_total_g' => 'nullable|numeric|min:0',
            'fat_saturated_g' => 'nullable|numeric|min:0',
            'fat_trans_g' => 'nullable|numeric|min:0',
            'protein_g' => 'nullable|numeric|min:0',
            'sodium_mg' => 'nullable|numeric|min:0',
            'potassium_mg' => 'nullable|numeric|min:0',
            'cholesterol_mg' => 'nullable|numeric|min:0',
            'carbohydrates_total_g' => 'nullable|numeric|min:0',
            'fiber_g' => 'nullable|numeric|min:0',
            'sugar_g' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $nutrition = Nutrition::create($validator->validated());

        return response()->json([
            'message' => 'Nutrition created successfully',
            'data' => new NutritionResource($nutrition),
        ], 201);
    }

    #[OA\Put(
        path: '/nutritions/{nutritionId}',
        summary: 'Update nutrition item (ADMIN only)',
        security: [['bearerAuth' => []]],
        tags: ['Nutritions'],
        parameters: [
            new OA\Parameter(name: 'nutritionId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'nutrition_name', type: 'string'),
                    new OA\Property(property: 'calories', type: 'number', format: 'float'),
                    new OA\Property(property: 'serving_size_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'fat_total_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'fat_saturated_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'fat_trans_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'protein_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'sodium_mg', type: 'number', format: 'float'),
                    new OA\Property(property: 'potassium_mg', type: 'number', format: 'float'),
                    new OA\Property(property: 'cholesterol_mg', type: 'number', format: 'float'),
                    new OA\Property(property: 'carbohydrates_total_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'fiber_g', type: 'number', format: 'float'),
                    new OA\Property(property: 'sugar_g', type: 'number', format: 'float'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Nutrition updated successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Nutrition not found'),
        ]
    )]
    public function update(Request $request, int|string $nutritionId): JsonResponse
    {
        $nutrition = Nutrition::find($nutritionId);
        if (! $nutrition) {
            return response()->json(['message' => 'Nutrition not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nutrition_name' => 'nullable|string|max:255',
            'calories' => 'nullable|numeric|min:0',
            'serving_size_g' => 'nullable|numeric|min:0',
            'fat_total_g' => 'nullable|numeric|min:0',
            'fat_saturated_g' => 'nullable|numeric|min:0',
            'fat_trans_g' => 'nullable|numeric|min:0',
            'protein_g' => 'nullable|numeric|min:0',
            'sodium_mg' => 'nullable|numeric|min:0',
            'potassium_mg' => 'nullable|numeric|min:0',
            'cholesterol_mg' => 'nullable|numeric|min:0',
            'carbohydrates_total_g' => 'nullable|numeric|min:0',
            'fiber_g' => 'nullable|numeric|min:0',
            'sugar_g' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = array_filter($validator->validated(), fn ($val) => $val !== null);
        $nutrition->update($validated);

        return response()->json([
            'message' => 'Nutrition updated successfully',
            'data' => new NutritionResource($nutrition),
        ]);
    }

    #[OA\Delete(
        path: '/nutritions/{nutritionId}',
        summary: 'Delete nutrition item (ADMIN only)',
        security: [['bearerAuth' => []]],
        tags: ['Nutritions'],
        parameters: [
            new OA\Parameter(name: 'nutritionId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Nutrition deleted successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Nutrition not found'),
        ]
    )]
    public function destroy(int|string $nutritionId): JsonResponse
    {
        $nutrition = Nutrition::find($nutritionId);
        if (! $nutrition) {
            return response()->json(['message' => 'Nutrition not found'], 404);
        }

        $nutrition->foods()->detach();
        $nutrition->delete();

        return response()->json(['message' => 'Nutrition deleted successfully']);
    }
}
