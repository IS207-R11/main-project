<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EatenFoodItem extends Model
{
    use HasFactory;

    protected $table = 'EATEN_FOOD_ITEMS';

    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = null;

    protected $fillable = [
        'eaten_food_id',
        'food_id',
        'quantity',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
        ];
    }

    public function eatenFood(): BelongsTo
    {
        return $this->belongsTo(EatenFood::class, 'eaten_food_id', 'eaten_food_id');
    }

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class, 'food_id', 'food_id');
    }
}
