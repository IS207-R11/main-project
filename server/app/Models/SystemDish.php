<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SystemDish extends Model
{
    use HasFactory;

    protected $table = 'system_dishes';

    protected $fillable = [
        'title',
        'slug',
        'image_url',
        'instructions',
        'total_calo',
        'favourite_count',
        'source_url',
    ];

    protected function casts(): array
    {
        return [
            'total_calo' => 'decimal:2',
            'favourite_count' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(
            NutritionIngredient::class,
            'system_dish_ingredients',
            'dish_id',
            'ingredient_id'
        )->withPivot('quantity_display', 'weight_in_grams');
    }

    public function dishIngredients(): HasMany
    {
        return $this->hasMany(SystemDishIngredient::class, 'dish_id', 'id');
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(UserDishInteraction::class, 'dish_id', 'id');
    }

    /**
     * Compute total calories using formula:
     * T = sum(Wi * (1 - Ri/100) * (Ni / 100))
     */
    public function computeTotalCalories(): float
    {
        $this->loadMissing('ingredients');
        $total = 0.0;

        foreach ($this->ingredients as $ingredient) {
            $w = (float) $ingredient->pivot->weight_in_grams;
            $r = (float) $ingredient->refuse_rate / 100.0;
            $n = (float) $ingredient->calo_per_100g;

            $total += $w * (1.0 - $r) * ($n / 100.0);
        }

        return round($total, 2);
    }
}

