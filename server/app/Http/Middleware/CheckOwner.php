<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckOwner
{
    /**
     * Handle an incoming request.
     *
     * @param  string  ...$allowedRoles  Roles (Array format) that can bypass ownership check (e.g. 'ADMIN', 'MODERATOR')
     */
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        $user = $request->user() ?? $request->attributes->get('auth_user');
        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Bypass cho 1 số role
        $userRole = $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;

        // Flatten allowed roles if passed comma-separated
        $expandedAllowed = [];
        foreach ($allowedRoles as $r) {
            foreach (explode(',', $r) as $subR) {
                $expandedAllowed[] = trim($subR);
            }
        }

        if (in_array($userRole, $expandedAllowed, true)) {
            return $next($request);
        }

        // Extract target userId from route or request
        $targetUserId = $request->route('userId')
            ?? $request->route('id')
            ?? $request->route('user_id')
            ?? $request->route('userID')
            ?? $request->input('userId')
            ?? $request->input('user_id')
            ?? $request->query('userId')
            ?? $request->query('user_id');

        if ($targetUserId !== null && (int) $targetUserId === (int) $user->user_id) {
            return $next($request);
        }

        if ($targetUserId === null) {
            return $next($request);
        }

        return response()->json(['message' => 'Unauthorized'], 401);
    }
}
