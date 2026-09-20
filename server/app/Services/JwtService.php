<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class JwtService
{
    private string $secretKey = '75402ffd7e6fa325c000ba9aeaae940e';

    private int $accessTokenTtl = 3600; // 1 hour

    private int $refreshTokenTtl = 2592000; // 30 days

    /**
     * Generate Access Token with jwtPayloadDTO structure.
     */
    public function generateAccessToken(User $user): string
    {
        $expiredAt = time() + $this->accessTokenTtl;

        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256',
        ];

        $payload = [
            'user_id' => $user->user_id,
            'user_role' => $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role,
            'expired_at' => $expiredAt,
            'exp' => $expiredAt,
            'iat' => time(),
        ];

        return $this->encode($header, $payload, $this->secretKey);
    }

    /**
     * Generate and store Refresh Token.
     */
    public function generateRefreshToken(User $user): string
    {
        $refreshToken = Str::random(64);
        $key = 'refresh_token:'.$refreshToken;
        $userKey = 'user_refresh_tokens:'.$user->username;

        // Store token -> userId mapping
        Cache::put($key, $user->user_id, $this->refreshTokenTtl);

        // Track tokens for user to allow revocation by username
        $existingTokens = Cache::get($userKey, []);
        $existingTokens[] = $refreshToken;
        Cache::put($userKey, $existingTokens, $this->refreshTokenTtl);

        return $refreshToken;
    }

    /**
     * Validate Access Token and return jwtPayloadDTO array.
     */
    public function validateAccessToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        $expectedSig = $this->base64UrlEncode(
            hash_hmac('sha256', $headerB64.'.'.$payloadB64, $this->secretKey, true)
        );

        if (! hash_equals($expectedSig, $signatureB64)) {
            return null;
        }

        $payload = json_decode($this->base64UrlDecode($payloadB64), true);
        if (! $payload || ! isset($payload['user_id'])) {
            return null;
        }

        $exp = $payload['expired_at'] ?? $payload['exp'] ?? 0;
        if ($exp < time()) {
            return null;
        }

        return $payload;
    }

    /**
     * Validate Refresh Token and return associated User.
     */
    public function validateRefreshToken(string $refreshToken): ?User
    {
        $userId = Cache::get('refresh_token:'.$refreshToken);
        if (! $userId) {
            return null;
        }

        return User::find($userId);
    }

    /**
     * Revoke Refresh Token(s) by token or username.
     */
    public function revokeRefreshToken(string $tokenOrUsername): void
    {
        // Check if direct token
        $userId = Cache::get('refresh_token:'.$tokenOrUsername);
        if ($userId) {
            Cache::forget('refresh_token:'.$tokenOrUsername);
        }

        // Also check if username was passed
        $tokens = Cache::get('user_refresh_tokens:'.$tokenOrUsername, []);
        foreach ($tokens as $tok) {
            Cache::forget('refresh_token:'.$tok);
        }
        Cache::forget('user_refresh_tokens:'.$tokenOrUsername);
    }

    private function encode(array $header, array $payload, string $secret): string
    {
        $headerEncoded = $this->base64UrlEncode(json_encode($header));
        $payloadEncoded = $this->base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $headerEncoded.'.'.$payloadEncoded, $secret, true);
        $signatureEncoded = $this->base64UrlEncode($signature);

        return $headerEncoded.'.'.$payloadEncoded.'.'.$signatureEncoded;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4 ? strlen($data) + (4 - strlen($data) % 4) : strlen($data), '=', STR_PAD_RIGHT));
    }
}
