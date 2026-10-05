<?php

namespace App\Models;

use App\Enums\FoodStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Food extends Model
{
    use HasFactory;

    protected $table = 'FOODS';

    protected $primaryKey = 'food_id';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'description',
        'image_url',
        'status',
        'contributor_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => FoodStatus::class,
            'created_at' => 'datetime',
        ];
    }

    public function contributor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'contributor_id', 'user_id');
    }

    public function favoriteUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'FAVORITE_FOODS', 'food_id', 'user_id')
            ->withPivot('note');
    }

    public function hatedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'HATED_FOODS', 'food_id', 'user_id')
            ->withPivot('note');
    }

    public function eatenFoods(): HasMany
    {
        return $this->hasMany(EatenFood::class, 'food_id', 'food_id');
    }

    public function gachaFoods(): HasMany
    {
        return $this->hasMany(GachaFood::class, 'food_id', 'food_id');
    }
}
