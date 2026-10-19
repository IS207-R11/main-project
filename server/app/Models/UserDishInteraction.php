<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDishInteraction extends Model
{
    use HasFactory;

    protected $table = 'user_dish_interactions';

    public $timestamps = false;
    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'dish_id',
        'interaction_type',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function dish(): BelongsTo
    {
        return $this->belongsTo(SystemDish::class, 'dish_id', 'id');
    }
}

