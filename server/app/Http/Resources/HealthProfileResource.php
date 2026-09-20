<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HealthProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'profile_id' => $this->profile_id,
            'user_id' => $this->user_id,
            'weight' => (float) $this->weight,
            'height' => (float) $this->height,
            'date_of_measuring' => $this->date_of_measuring ? (is_string($this->date_of_measuring) ? $this->date_of_measuring : $this->date_of_measuring->format('Y-m-d')) : null,
            'measuring_method' => $this->measuring_method instanceof \BackedEnum ? $this->measuring_method->value : $this->measuring_method,
            'labor_level' => $this->labor_level instanceof \BackedEnum ? $this->labor_level->value : $this->labor_level,
            'maternity_status' => $this->maternity_status instanceof \BackedEnum ? $this->maternity_status->value : $this->maternity_status,
        ];
    }
}
