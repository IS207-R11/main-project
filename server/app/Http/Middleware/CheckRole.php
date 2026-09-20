<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  string  ...$roles  Allowed roles (Array format) (e.g. 'ADMIN', 'MODERATOR', 'USER')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user() ?? $request->attributes->get('auth_user');
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $userRole = $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;

        if (! in_array($userRole, $roles, true)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
