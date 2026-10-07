<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EatenFood extends Model
{
    use HasFactory;

    protected $table = 'EATEN_FOODS';

    protected $primaryKey = 'eaten_id';

    public $incrementing = true;

    public $timestamps = false;

    protected $fillable = [
        'eaten_id',
        'user_id',
        'food_id',
        'note',
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
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class, 'food_id', 'food_id');
    }
}
