<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'role' => $this->role instanceof \BackedEnum ? $this->role->value : $this->role,
            'email' => $this->email,
            'username' => $this->username,
            'address' => $this->address,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'created_at' => $this->created_at ? (is_string($this->created_at) ? $this->created_at : $this->created_at->format('Y-m-d H:i:s')) : null,
        ];
    }
}
