<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;

class UserFoodResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'food_id' => $this->food_id,
            'name' => $this->name,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'note' => $this->pivot?->note ?? $this->note ?? null,
            'created_at' => $this->created_at ? (is_string($this->created_at) ? $this->created_at : $this->created_at->format('Y-m-d H:i:s')) : null,
            'contributor_id' => $this->contributor_id,
            'favorite_count' => isset($this->favorite_count)
                ? (int) $this->favorite_count
                : (int) DB::table('FAVORITE_FOODS')->where('food_id', $this->food_id)->distinct()->count('user_id'),
            'eaten_count' => isset($this->eaten_count)
                ? (int) $this->eaten_count
                : (int) DB::table('EATEN_FOODS')->where('food_id', $this->food_id)->distinct()->count('user_id'),
        ];
    }
}
