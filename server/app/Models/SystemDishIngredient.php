<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemDishIngredient extends Model
{
    use HasFactory;

    protected $table = 'system_dish_ingredients';

    public $timestamps = false;
    public $incrementing = false;

    protected $fillable = [
        'dish_id',
        'ingredient_id',
        'quantity_display',
        'weight_in_grams',
    ];

    protected function casts(): array
    {
        return [
            'weight_in_grams' => 'decimal:2',
        ];
    }

    public function dish(): BelongsTo
    {
        return $this->belongsTo(SystemDish::class, 'dish_id', 'id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(NutritionIngredient::class, 'ingredient_id', 'id');
    }
}

