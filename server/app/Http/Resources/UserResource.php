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
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'date_of_birth' => $this->date_of_birth ? (is_string($this->date_of_birth) ? $this->date_of_birth : $this->date_of_birth->format('Y-m-d')) : null,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_url,
            'gender' => $this->gender instanceof \BackedEnum ? $this->gender->value : $this->gender,
            'created_at' => $this->created_at ? (is_string($this->created_at) ? $this->created_at : $this->created_at->format('Y-m-d')) : null,
        ];
    }
}
