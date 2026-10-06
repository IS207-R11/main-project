<?php

namespace App\Http\Resources;

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
        $favoriteCount = isset($this->favorite_count)
            ? (int) $this->favorite_count
            : (int) DB::table('FAVORITE_FOODS')->where('food_id', $this->food_id)->distinct()->count('user_id');
        $eatenCount = isset($this->eaten_count)
            ? (int) $this->eaten_count
            : (int) DB::table('EATEN_FOODS')->where('food_id', $this->food_id)->distinct()->count('user_id');

        $rank = $this->rank instanceof \BackedEnum ? $this->rank->value : ($this->rank ?? null);
        if (! $rank) {
            $score = $favoriteCount + $eatenCount;
            $rank = match (true) {
                $score >= 10 => \App\Enums\FoodRank::SSR->value,
                $score >= 5 => \App\Enums\FoodRank::SR->value,
                $score >= 2 => \App\Enums\FoodRank::UC->value,
                default => \App\Enums\FoodRank::C->value,
            };
        }

        return [
            'food_id' => $this->food_id,
            'name' => $this->name,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'rank' => $rank,
            'created_at' => $this->created_at ? (is_string($this->created_at) ? $this->created_at : $this->created_at->format('Y-m-d H:i:s')) : null,
            'contributor_id' => $this->contributor_id,
            'favorite_count' => $favoriteCount,
            'eaten_count' => $eatenCount,
            'contributor' => $this->whenLoaded('contributor', function () {
                return [
                    'user_id' => $this->contributor?->user_id,
                    'username' => $this->contributor?->username,
                ];
            }),
        ];
    }
}
