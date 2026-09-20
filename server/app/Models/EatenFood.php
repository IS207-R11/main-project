<?php

namespace App\Models;

use App\Enums\MealType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EatenFood extends Model
{
    use HasFactory;

    protected $table = 'EATEN_FOODS';

    protected $primaryKey = 'eaten_food_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'meal_type',
        'eaten_at',
        'address',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'meal_type' => MealType::class,
            'eaten_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(EatenFoodItem::class, 'eaten_food_id', 'eaten_food_id');
    }
}
