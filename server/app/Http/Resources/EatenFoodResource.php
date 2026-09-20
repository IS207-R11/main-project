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
            'user_id' => $this->user_id,
            'eaten_food_id' => $this->eaten_food_id,
            'meal_type' => $this->meal_type instanceof \BackedEnum ? $this->meal_type->value : $this->meal_type,
            'eaten_at' => $this->eaten_at ? (is_string($this->eaten_at) ? $this->eaten_at : $this->eaten_at->format('Y-m-d H:i:s')) : null,
            'address' => $this->address,
            'note' => $this->note,
            'items' => $this->items ? $this->items->map(function ($item) {
                return [
                    'food' => $item->food ? [new FoodCardResource($item->food)] : [],
                    'quantity' => (float) $item->quantity,
                ];
            }) : [],
        ];
    }
}
