<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

class FoodCardResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->status instanceof \BackedEnum ? $this->status->value : $this->status;
        $createdAt = $this->created_at ? (is_string($this->created_at) ? $this->created_at : $this->created_at->format('Y-m-d H:i:s')) : null;

        $user = $request->user() ?? $request->attributes->get('auth_user');
        if (! $user && $request->bearerToken()) {
            try {
                $jwtService = app(JwtService::class);
                $payload = $jwtService->validateAccessToken($request->bearerToken());
                if ($payload && isset($payload['user_id'])) {
                    $user = User::find($payload['user_id']);
                    if ($user) {
                        $request->setUserResolver(fn () => $user);
                        $request->attributes->set('auth_user', $user);
                    }
                }
            } catch (\Throwable) {
                // Ignore invalid token
            }
        }

        $favoriteIds = $request->attributes->get('user_favorite_food_ids');
        if ($favoriteIds === null) {
            if ($user) {
                $favoriteIds = DB::table('FAVORITE_FOODS')
                    ->where('user_id', $user->user_id)
                    ->pluck('food_id')
                    ->map(fn ($id) => (int) $id)
                    ->all();
            } else {
                $favoriteIds = [];
            }
            $request->attributes->set('user_favorite_food_ids', $favoriteIds);
        }

        $hatedIds = $request->attributes->get('user_hated_food_ids');
        if ($hatedIds === null) {
            if ($user) {
                $hatedIds = DB::table('HATED_FOODS')
                    ->where('user_id', $user->user_id)
                    ->pluck('food_id')
                    ->map(fn ($id) => (int) $id)
                    ->all();
            } else {
                $hatedIds = [];
            }
            $request->attributes->set('user_hated_food_ids', $hatedIds);
        }

        $eatenIds = $request->attributes->get('user_eaten_food_ids');
        if ($eatenIds === null) {
            if ($user) {
                $eatenIds = DB::table('EATEN_FOODS')
                    ->where('user_id', $user->user_id)
                    ->pluck('food_id')
                    ->map(fn ($id) => (int) $id)
                    ->all();
            } else {
                $eatenIds = [];
            }
            $request->attributes->set('user_eaten_food_ids', $eatenIds);
        }

        $favoritesCounts = $request->attributes->get('foods_favorites_counts');
        if ($favoritesCounts === null) {
            $favoritesCounts = DB::table('FAVORITE_FOODS')
                ->select('food_id', DB::raw('count(*) as count'))
                ->groupBy('food_id')
                ->pluck('count', 'food_id')
                ->all();
            $request->attributes->set('foods_favorites_counts', $favoritesCounts);
        }

        $hatedCounts = $request->attributes->get('foods_hated_counts');
        if ($hatedCounts === null) {
            $hatedCounts = DB::table('HATED_FOODS')
                ->select('food_id', DB::raw('count(*) as count'))
                ->groupBy('food_id')
                ->pluck('count', 'food_id')
                ->all();
            $request->attributes->set('foods_hated_counts', $hatedCounts);
        }

        $eatenCounts = $request->attributes->get('foods_eaten_counts');
        if ($eatenCounts === null) {
            $eatenCounts = DB::table('EATEN_FOODS')
                ->select('food_id', DB::raw('count(*) as count'))
                ->groupBy('food_id')
                ->pluck('count', 'food_id')
                ->all();
            $request->attributes->set('foods_eaten_counts', $eatenCounts);
        }

        $foodId = (int) $this->food_id;

        return [
            'food_id' => $foodId,
            'name' => $this->name,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'status' => $status,
            'created_at' => $createdAt,
            'contributor_id' => $this->contributor_id !== null ? (int) $this->contributor_id : null,
            'rating_score' => isset($this->rating_score) && $this->rating_score !== null ? (float) $this->rating_score : null,
            'cd' => isset($this->cd) && $this->cd !== null ? (float) $this->cd : null,
            'food_rank' => $this->food_rank ?? null,
            'is_favorited' => in_array($foodId, $favoriteIds, true),
            'is_hated' => in_array($foodId, $hatedIds, true),
            'is_eaten' => in_array($foodId, $eatenIds, true),
            'favorites_count' => (int) ($favoritesCounts[$foodId] ?? 0),
            'hated_count' => (int) ($hatedCounts[$foodId] ?? 0),
            'eaten_count' => (int) ($eatenCounts[$foodId] ?? 0),
        ];
    }
}
