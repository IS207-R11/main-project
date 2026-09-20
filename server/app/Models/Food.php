<?php

namespace App\Models;

use App\Enums\FoodStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Food extends Model
{
    use HasFactory;

    protected $table = 'FOODS';

    protected $primaryKey = 'food_id';

    public $timestamps = false;

    protected $fillable = [
        'food_name',
        'quip',
        'sub',
        'price',
        'image_url',
        'status',
        'submitted_by',
        'note',
        'is_veg',
        'sessions',
    ];

    protected function casts(): array
    {
        return [
            'status' => FoodStatus::class,
            'is_veg' => 'boolean',
            'sessions' => 'array',
            'price' => 'decimal:2',
        ];
    }

    public function nutritions(): BelongsToMany
    {
        return $this->belongsToMany(Nutrition::class, 'FOOD_NUTRITIONS', 'food_id', 'nutrition_id');
    }

    public function submittedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by', 'user_id');
    }

    public function favoriteUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'FAVORITE_FOODS', 'food_id', 'user_id');
    }

    public function scannedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'SCANNED_FOODS', 'food_id', 'user_id');
    }
}
