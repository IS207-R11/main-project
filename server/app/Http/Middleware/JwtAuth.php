<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuth
{
    public function __construct(private JwtService $jwtService) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        if (! $token) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $payload = $this->jwtService->validateAccessToken($token);
        if (! $payload) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user = User::find($payload['user_id']);
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($user->status instanceof \BackedEnum && $user->status->value === 'BANNED') { // BackedEnum = interface của các scalar enum
            return response()->json(['message' => 'User is banned'], 401);
        }

        $request->setUserResolver(function () use ($user) {
            return $user;
        });
        // Sau dòng này, ở bất kỳ đâu trong cùng request (middleware phía sau, controller, FormRequest), gọi $request->user() sẽ trả về $user mà middleware jwt.auth đã xác thực từ token.

        // Lưu tạm jwt_payload và auth_user vào request
        $request->attributes->set('jwt_payload', $payload);
        $request->attributes->set('auth_user', $user); // fallback của setUserResolver

        return $next($request);
    }
}
