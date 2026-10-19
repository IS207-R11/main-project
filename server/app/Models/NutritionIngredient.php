<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class NutritionIngredient extends Model
{
    use HasFactory;

    protected $table = 'nutrition_ingredients';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'calo_per_100g',
        'refuse_rate',
    ];

    protected function casts(): array
    {
        return [
            'calo_per_100g' => 'decimal:2',
            'refuse_rate' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function dishes(): BelongsToMany
    {
        return $this->belongsToMany(
            SystemDish::class,
            'system_dish_ingredients',
            'ingredient_id',
            'dish_id'
        )->withPivot('quantity_display', 'weight_in_grams');
    }

    public function allergicUsers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'user_allergy_ingredients',
            'ingredient_id',
            'user_id'
        );
    }
}

