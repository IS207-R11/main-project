<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    public function __construct(private JwtService $jwtService) {}

    #[OA\Post(
        path: '/auth/signin',
        summary: 'User sign in',
        description: 'Authenticate user with username and password, returns access and refresh tokens',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['username', 'password'],
                properties: [
                    new OA\Property(property: 'username', type: 'string', example: 'john_doe'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'Secret123!'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Sign in successful',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'access_token', type: 'string'),
                        new OA\Property(property: 'refresh_token', type: 'string'),
                        new OA\Property(property: 'token_type', type: 'string', example: 'Bearer'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Invalid credentials or disabled account'),
        ]
    )]
    public function signin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('username', $request->input('username'))
            ->orWhere('email', $request->input('username'))
            ->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password_hashed)) {
            return response()->json(['message' => 'Invalid username or password'], 401);
        }

        $userStatus = $user->status instanceof \BackedEnum ? $user->status->value : (string) $user->status;
        if ($userStatus === 'BANNED' || $userStatus === 'DISABLED') {
            return response()->json(['message' => 'Account is not active'], 401);
        }

        $accessToken = $this->jwtService->generateAccessToken($user);
        $refreshToken = $this->jwtService->generateRefreshToken($user);

        $cookie = cookie('refreshToken', $refreshToken, 60 * 24 * 30, '/', null, false, true);

        return response()->json([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
        ])->withCookie($cookie);
    }

    #[OA\Post(
        path: '/auth/signup',
        summary: 'User sign up',
        description: 'Register a new user account with username, email, and password',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['username', 'password'],
                properties: [
                    new OA\Property(property: 'username', type: 'string', example: 'new_user'),
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'new_user@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'Secret123!'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'User created successfully'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function signup(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:100|unique:USERS,username',
            'email' => 'nullable|email|max:255|unique:USERS,email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $username = $request->input('username');
        $email = $request->input('email') ?? ($username.'@foodlife.app');

        // Check if generated email exists
        if (User::where('email', $email)->exists()) {
            $email = $username.'_'.time().'@foodlife.app';
        }

        $user = User::create([
            'username' => $username,
            'email' => $email,
            'password_hashed' => Hash::make($request->input('password')),
            'role' => UserRole::USER,
            'status' => UserStatus::ACTIVE,
        ]);

        $accessToken = $this->jwtService->generateAccessToken($user);
        $refreshToken = $this->jwtService->generateRefreshToken($user);
        $cookie = cookie('refreshToken', $refreshToken, 60 * 24 * 30, '/', null, false, true);

        return response()->json([
            'message' => 'User registered successfully',
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
        ], 201)->withCookie($cookie);
    }

    #[OA\Post(
        path: '/auth/signout',
        summary: 'User sign out',
        description: 'Invalidate refresh token and log user out',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'username', type: 'string', example: 'john_doe'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Signed out successfully'),
        ]
    )]
    public function signout(Request $request): JsonResponse
    {
        $username = $request->input('username');
        $refreshToken = $request->input('refreshToken') ?? $request->cookie('refreshToken');

        if ($refreshToken) {
            $this->jwtService->revokeRefreshToken($refreshToken);
        }
        if ($username) {
            $this->jwtService->revokeRefreshToken($username);
        }

        $forgetCookie = Cookie::forget('refreshToken');

        return response()->json(['message' => 'Successfully logged out'])->withCookie($forgetCookie);
    }

    #[OA\Post(
        path: '/auth/refresh-token',
        summary: 'Refresh access token',
        description: 'Provide a valid refresh token to get a new access token',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: false,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'refreshToken', type: 'string'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Token refreshed successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'access_token', type: 'string'),
                        new OA\Property(property: 'token_type', type: 'string', example: 'Bearer'),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Invalid or expired refresh token'),
        ]
    )]
    public function refreshToken(Request $request): JsonResponse
    {
        $refreshToken = $request->input('refreshToken')
            ?? $request->input('refresh_token')
            ?? $request->cookie('refreshToken');

        if (! $refreshToken) {
            return response()->json(['message' => 'Refresh token required'], 401);
        }

        $user = $this->jwtService->validateRefreshToken($refreshToken);
        if (! $user) {
            return response()->json(['message' => 'Invalid or expired refresh token'], 401);
        }

        $newAccessToken = $this->jwtService->generateAccessToken($user);

        return response()->json([
            'access_token' => $newAccessToken,
            'token_type' => 'Bearer',
        ]);
    }

    #[OA\Post(
        path: '/auth/change-password/{userID}',
        summary: 'Change user password',
        description: 'Update password for a specific user (Allowed for OWNER and ADMIN)',
        security: [['bearerAuth' => []]],
        tags: ['Authentication'],
        parameters: [
            new OA\Parameter(name: 'userID', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['newPassword'],
                properties: [
                    new OA\Property(property: 'oldPassword', type: 'string', format: 'password'),
                    new OA\Property(property: 'newPassword', type: 'string', format: 'password'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Password changed successfully'),
            new OA\Response(response: 401, description: 'Unauthorized or incorrect old password'),
            new OA\Response(response: 404, description: 'User not found'),
        ]
    )]
    public function changePassword(Request $request, int|string $userID): JsonResponse
    {
        $targetUser = User::find($userID);
        if (! $targetUser) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $authUser = $request->user();
        $isOwner = $authUser && (int) $authUser->user_id === (int) $targetUser->user_id;
        $isAdmin = $authUser && ($authUser->role instanceof \BackedEnum ? $authUser->role->value === 'ADMIN' : $authUser->role === 'ADMIN');

        $oldPassword = $request->input('oldPassword') ?? $request->input('old_password');
        $newPassword = $request->input('newPassword') ?? $request->input('new_password');

        if (! $newPassword || strlen($newPassword) < 6) {
            return response()->json(['message' => 'New password must be at least 6 characters'], 422);
        }

        if ($isOwner && ! $isAdmin) {
            if (! $oldPassword || ! Hash::check($oldPassword, $targetUser->password_hashed)) {
                return response()->json(['message' => 'Old password is incorrect'], 401);
            }
        }

        $targetUser->password_hashed = Hash::make($newPassword);
        $targetUser->save();

        return response()->json(['message' => 'Password changed successfully']);
    }
}
