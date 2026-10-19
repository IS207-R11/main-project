<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommunityTopic extends Model
{
    use HasFactory;

    protected $table = 'community_topics';

    protected $fillable = [
        'title',
        'slug',
        'description',
        'cover_image',
        'created_by',
        'post_count',
    ];

    protected function casts(): array
    {
        return [
            'post_count' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function posts(): HasMany
    {
        return $this->hasMany(CommunityPost::class, 'topic_id', 'id');
    }
}

