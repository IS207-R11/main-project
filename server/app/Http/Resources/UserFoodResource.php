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
        $status = $this->status instanceof \BackedEnum ? $this->status->value : $this->status;
        $createdAt = $this->created_at ? (is_string($this->created_at) ? $this->created_at : $this->created_at->format('Y-m-d H:i:s')) : null;

        return [
            'food_id' => (int) $this->food_id,
            'name' => $this->name,
            'description' => $this->description,
            'image_url' => $this->image_url,
            'status' => $status,
            'note' => $this->pivot?->note ?? $this->note ?? null,
            'created_at' => $createdAt,
            'contributor_id' => $this->contributor_id !== null ? (int) $this->contributor_id : null,
        ];
    }
}
