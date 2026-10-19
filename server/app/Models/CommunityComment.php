<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityComment extends Model
{
    use HasFactory;

    protected $table = 'community_comments';

    protected $fillable = [
        'post_id',
        'user_id',
        'parent_comment_id',
        'content',
        'image_url',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'image_url' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function post(): BelongsTo
    {
        return $this->belongsTo(CommunityPost::class, 'post_id', 'id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(CommunityComment::class, 'parent_comment_id', 'id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(CommunityComment::class, 'parent_comment_id', 'id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(ModerationReport::class, 'target_id', 'id')
            ->where('target_type', 'COMMENT');
    }
}

