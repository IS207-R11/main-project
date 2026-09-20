<?php

namespace App\Http\Controllers\Api;

use App\Enums\Gender;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\FuzzySearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;
use OpenApi\Attributes as OA;

class UserController extends Controller
{
    public function __construct(private FuzzySearchService $fuzzySearchService) {}

    #[OA\Get(
        path: '/users',
        summary: 'Get list of users with pagination and search',
        security: [['bearerAuth' => []]],
        tags: ['Users'],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'List of users with pagination'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $page = (int) ($request->query('page') ?? 1);
        $pageSize = (int) ($request->query('pageSize') ?? $request->query('page-size') ?? $request->query('page_size') ?? 10);
        $search = (string) ($request->query('search') ?? '');

        $query = User::query();

        if (trim($search) !== '') {
            $query = $this->fuzzySearchService->applyQueryFilter($query, $search, ['username', 'email', 'phone']);
            $items = $query->get();
            $sortedItems = $this->fuzzySearchService->sortBySimilarity($items, $search, ['username', 'email', 'phone']);
            $totalRecords = User::count();
            $pagedItems = $sortedItems->slice(($page - 1) * $pageSize, $pageSize)->values();

            return response()->json([
                'data' => UserResource::collection($pagedItems),
                'total_records' => $totalRecords,
            ]);
        }

        $totalRecords = User::count();
        $users = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => UserResource::collection($users),
            'total_records' => $totalRecords,
        ]);
    }

    #[OA\Get(
        path: '/users/{id}',
        summary: 'Get user details by ID',
        security: [['bearerAuth' => []]],
        tags: ['Users'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'User details'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'User not found'),
        ]
    )]
    public function show(int|string $id): JsonResponse
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return (new UserResource($user))->response();
    }

    #[OA\Put(
        path: '/users/{id}',
        summary: 'Update user profile (OWNER only)',
        security: [['bearerAuth' => []]],
        tags: ['Users'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'username', type: 'string'),
                    new OA\Property(property: 'email', type: 'string', format: 'email'),
                    new OA\Property(property: 'date_of_birth', type: 'string', format: 'date'),
                    new OA\Property(property: 'phone', type: 'string'),
                    new OA\Property(property: 'avatar_url', type: 'string'),
                    new OA\Property(property: 'gender', type: 'string', enum: ['MALE', 'FEMALE']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'User updated successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'User not found'),
        ]
    )]
    public function update(Request $request, int|string $id): JsonResponse
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'username' => 'nullable|string|max:100|unique:USERS,username,'.$user->user_id.',user_id',
            'email' => 'nullable|email|max:255|unique:USERS,email,'.$user->user_id.',user_id',
            'date_of_birth' => 'nullable|date',
            'phone' => 'nullable|string|max:20',
            'avatar_url' => 'nullable|string|max:500',
            'gender' => ['nullable', new Enum(Gender::class)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();
        $user->fill(array_filter($validated, fn ($val) => $val !== null));
        $user->save();

        return response()->json(['message' => 'User updated successfully', 'data' => new UserResource($user)]);
    }

    #[OA\Put(
        path: '/users/{id}/change-status',
        summary: 'Change user status (ADMIN or MODERATOR)',
        security: [['bearerAuth' => []]],
        tags: ['Users'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', enum: ['ACTIVE', 'DISABLED', 'BANNED']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Status updated successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'User not found'),
        ]
    )]
    public function changeStatus(Request $request, int|string $id): JsonResponse
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => ['required', new Enum(UserStatus::class)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->status = $request->input('status');
        $user->save();

        return response()->json(['message' => 'User status updated successfully']);
    }

    #[OA\Delete(
        path: '/users/{id}',
        summary: 'Delete user account (OWNER or ADMIN)',
        security: [['bearerAuth' => []]],
        tags: ['Users'],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'User deleted successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'User not found'),
        ]
    )]
    public function destroy(int|string $id): JsonResponse
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
