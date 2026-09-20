<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'report_id' => $this->report_id,
            'author' => [
                'user_id' => $this->author?->user_id ?? $this->author_id,
                'username' => $this->author?->username,
            ],
            'resolved_by' => $this->resolved_by ? [
                'user_id' => $this->resolvedByUser?->user_id ?? $this->resolved_by,
                'username' => $this->resolvedByUser?->username,
            ] : null,
            'type' => $this->type instanceof \BackedEnum ? $this->type->value : $this->type,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : $this->status,
            'title' => $this->title,
            'content' => $this->content,
            'resolved_at' => $this->resolved_at ? (is_string($this->resolved_at) ? $this->resolved_at : $this->resolved_at->format('Y-m-d')) : null,
            'created_at' => $this->created_at ? (is_string($this->created_at) ? $this->created_at : $this->created_at->format('Y-m-d')) : null,
        ];
    }
}
