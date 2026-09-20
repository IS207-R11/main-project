<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NutritionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'nutrition_id' => $this->nutrition_id,
            'nutrition_name' => $this->nutrition_name,
            'calories' => $this->calories !== null ? (float) $this->calories : null,
            'serving_size_g' => $this->serving_size_g !== null ? (float) $this->serving_size_g : null,
            'fat_total_g' => $this->fat_total_g !== null ? (float) $this->fat_total_g : null,
            'fat_saturated_g' => $this->fat_saturated_g !== null ? (float) $this->fat_saturated_g : null,
            'fat_trans_g' => $this->fat_trans_g !== null ? (float) $this->fat_trans_g : null,
            'protein_g' => $this->protein_g !== null ? (float) $this->protein_g : null,
            'sodium_mg' => $this->sodium_mg !== null ? (float) $this->sodium_mg : null,
            'potassium_mg' => $this->potassium_mg !== null ? (float) $this->potassium_mg : null,
            'cholesterol_mg' => $this->cholesterol_mg !== null ? (float) $this->cholesterol_mg : null,
            'carbohydrates_total_g' => $this->carbohydrates_total_g !== null ? (float) $this->carbohydrates_total_g : null,
            'fiber_g' => $this->fiber_g !== null ? (float) $this->fiber_g : null,
            'sugar_g' => $this->sugar_g !== null ? (float) $this->sugar_g : null,
        ];
    }
}
