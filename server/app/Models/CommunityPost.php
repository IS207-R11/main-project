<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityPost extends Model
{
    use HasFactory;

    protected $table = 'community_posts';

    protected $fillable = [
        'topic_id',
        'author_id',
        'title',
        'story',
        'servings',
        'cook_time',
        'ingredients_json',
        'steps_json',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'servings' => 'integer',
            'ingredients_json' => 'array',
            'steps_json' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(CommunityTopic::class, 'topic_id', 'id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id', 'id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(CommunityComment::class, 'post_id', 'id')
            ->whereNull('parent_comment_id');
    }

    public function allComments(): HasMany
    {
        return $this->hasMany(CommunityComment::class, 'post_id', 'id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(ModerationReport::class, 'target_id', 'id')
            ->where('target_type', 'POST');
    }
}

