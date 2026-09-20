<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FoodCardResource extends JsonResource
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
            'food_name' => $this->food_name,
            'quip' => $this->quip,
            'sub' => $this->sub,
            'price' => $this->price !== null ? (float) $this->price : null,
            'image_url' => $this->image_url,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'note' => $this->note,
            'is_veg' => (bool) $this->is_veg,
            'sessions' => $this->sessions ?? [],
            'nutritions' => NutritionResource::collection($this->relationLoaded('nutritions') ? $this->nutritions : ($this->nutritions ?? [])),
        ];
    }
}
