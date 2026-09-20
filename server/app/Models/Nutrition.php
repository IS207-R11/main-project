<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Nutrition extends Model
{
    use HasFactory;

    protected $table = 'NUTRITIONS';

    protected $primaryKey = 'nutrition_id';

    public $timestamps = false;

    protected $fillable = [
        'nutrition_name',
        'calories',
        'serving_size_g',
        'fat_total_g',
        'fat_saturated_g',
        'fat_trans_g',
        'protein_g',
        'sodium_mg',
        'potassium_mg',
        'cholesterol_mg',
        'carbohydrates_total_g',
        'fiber_g',
        'sugar_g',
    ];

    protected function casts(): array
    {
        return [
            'calories' => 'decimal:2',
            'serving_size_g' => 'decimal:2',
            'fat_total_g' => 'decimal:2',
            'fat_saturated_g' => 'decimal:2',
            'fat_trans_g' => 'decimal:2',
            'protein_g' => 'decimal:2',
            'sodium_mg' => 'decimal:2',
            'potassium_mg' => 'decimal:2',
            'cholesterol_mg' => 'decimal:2',
            'carbohydrates_total_g' => 'decimal:2',
            'fiber_g' => 'decimal:2',
            'sugar_g' => 'decimal:2',
        ];
    }

    public function foods(): BelongsToMany
    {
        return $this->belongsToMany(Food::class, 'FOOD_NUTRITIONS', 'nutrition_id', 'food_id');
    }
}
