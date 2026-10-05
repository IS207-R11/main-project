<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EatenFoodResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'eaten_id' => $this->eaten_id,
            'user_id' => $this->user_id,
            'food_id' => $this->food_id,
            'food' => $this->whenLoaded('food', function () {
                return new FoodCardResource($this->food);
            }),
            'note' => $this->note,
            'created_at' => $this->created_at ? (is_string($this->created_at) ? $this->created_at : $this->created_at->format('Y-m-d H:i:s')) : null,
        ];
    }
}
