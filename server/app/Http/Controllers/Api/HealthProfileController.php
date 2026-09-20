<?php

namespace App\Http\Controllers\Api;

use App\Enums\LaborLevel;
use App\Enums\MaternityStatus;
use App\Enums\MeasuringMethod;
use App\Http\Controllers\Controller;
use App\Http\Resources\HealthProfileResource;
use App\Models\HealthProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;
use OpenApi\Attributes as OA;

class HealthProfileController extends Controller
{
    #[OA\Get(
        path: '/health-profiles/{userId}',
        summary: 'Get list of health profiles for a user',
        security: [['bearerAuth' => []]],
        tags: ['Health Profiles'],
        parameters: [
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of health profiles'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function index(Request $request, int|string $userId): JsonResponse
    {
        $page = (int) ($request->query('page') ?? 1);
        $pageSize = (int) ($request->query('pageSize') ?? $request->query('page-size') ?? $request->query('page_size') ?? 10);

        $query = HealthProfile::where('user_id', $userId)->orderBy('date_of_measuring', 'desc');
        $totalRecords = HealthProfile::count();
        $profiles = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => HealthProfileResource::collection($profiles),
            'total_records' => $totalRecords,
        ]);
    }

    #[OA\Post(
        path: '/health-profiles/{userId}',
        summary: 'Create a new health profile',
        security: [['bearerAuth' => []]],
        tags: ['Health Profiles'],
        parameters: [
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['weight', 'height', 'date_of_measuring', 'measuring_method'],
                properties: [
                    new OA\Property(property: 'weight', type: 'number', format: 'float', example: 65.5),
                    new OA\Property(property: 'height', type: 'number', format: 'float', example: 170.0),
                    new OA\Property(property: 'date_of_measuring', type: 'string', format: 'date', example: '2026-09-20'),
                    new OA\Property(property: 'measuring_method', type: 'string', enum: ['STANDING', 'LAYING']),
                    new OA\Property(property: 'labor_level', type: 'string', enum: ['LOW', 'MID', 'HEAVY']),
                    new OA\Property(property: 'maternity_status', type: 'string', enum: ['FIRST_3_MONTHS', 'MID_3_MONTHS', 'FINAL_3_MONTHS', 'BREASTFEEDING']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Health profile created successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request, int|string $userId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'weight' => 'required|numeric|min:1|max:500',
            'height' => 'required|numeric|min:1|max:300',
            'date_of_measuring' => 'required|date',
            'measuring_method' => ['required', new Enum(MeasuringMethod::class)],
            'labor_level' => ['nullable', new Enum(LaborLevel::class)],
            'maternity_status' => ['nullable', new Enum(MaternityStatus::class)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();
        $validated['user_id'] = (int) $userId;

        $profile = HealthProfile::create($validated);

        return response()->json([
            'message' => 'Health profile created successfully',
            'data' => new HealthProfileResource($profile),
        ], 201);
    }

    #[OA\Put(
        path: '/health-profiles/{userId}/{profileId}',
        summary: 'Update a health profile',
        security: [['bearerAuth' => []]],
        tags: ['Health Profiles'],
        parameters: [
            new OA\Parameter(name: 'userId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
            new OA\Parameter(name: 'profileId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'weight', type: 'number', format: 'float'),
                    new OA\Property(property: 'height', type: 'number', format: 'float'),
                    new OA\Property(property: 'date_of_measuring', type: 'string', format: 'date'),
                    new OA\Property(property: 'measuring_method', type: 'string', enum: ['STANDING', 'LAYING']),
                    new OA\Property(property: 'labor_level', type: 'string', enum: ['LOW', 'MID', 'HEAVY']),
                    new OA\Property(property: 'maternity_status', type: 'string', enum: ['FIRST_3_MONTHS', 'MID_3_MONTHS', 'FINAL_3_MONTHS', 'BREASTFEEDING']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Health profile updated successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Health profile not found'),
        ]
    )]
    public function update(Request $request, int|string $userId, int|string $profileId): JsonResponse
    {
        $profile = HealthProfile::where('profile_id', $profileId)->where('user_id', $userId)->first();
        if (! $profile) {
            return response()->json(['message' => 'Health profile not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'weight' => 'nullable|numeric|min:1|max:500',
            'height' => 'nullable|numeric|min:1|max:300',
            'date_of_measuring' => 'nullable|date',
            'measuring_method' => ['nullable', new Enum(MeasuringMethod::class)],
            'labor_level' => ['nullable', new Enum(LaborLevel::class)],
            'maternity_status' => ['nullable', new Enum(MaternityStatus::class)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = array_filter($validator->validated(), fn ($val) => $val !== null);
        $profile->update($validated);

        return response()->json([
            'message' => 'Health profile updated successfully',
            'data' => new HealthProfileResource($profile),
        ]);
    }

    #[OA\Delete(
        path: '/health-profiles/{profileId}',
        summary: 'Delete a health profile (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Health Profiles'],
        parameters: [
            new OA\Parameter(name: 'profileId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Health profile deleted successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Health profile not found'),
        ]
    )]
    public function destroy(Request $request, int|string $profileId): JsonResponse
    {
        $profile = HealthProfile::find($profileId);
        if (! $profile) {
            return response()->json(['message' => 'Health profile not found'], 404);
        }

        $authUser = $request->user();
        $isOwner = $authUser && (int) $authUser->user_id === (int) $profile->user_id;
        $isAdmin = $authUser && ($authUser->role instanceof \BackedEnum ? $authUser->role->value === 'ADMIN' : $authUser->role === 'ADMIN');

        if (! $isOwner && ! $isAdmin) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $profile->delete();

        return response()->json(['message' => 'Health profile deleted successfully']);
    }
}
