<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'USERS';

    protected $primaryKey = 'user_id';

    public $timestamps = false;

    protected $fillable = [
        'email',
        'username',
        'address',
        'role',
        'status',
        'hashed_password',
    ];

    protected $hidden = [
        'hashed_password',
    ];

    /**
     * Get the password for the user.
     */
    public function getAuthPassword(): string
    {
        return $this->hashed_password;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => UserRole::class,
            'status' => UserStatus::class,
            'created_at' => 'datetime',
        ];
    }

    public function favoriteFoods(): BelongsToMany
    {
        return $this->belongsToMany(Food::class, 'FAVORITE_FOODS', 'user_id', 'food_id')
            ->withPivot('note');
    }

    public function hatedFoods(): BelongsToMany
    {
        return $this->belongsToMany(Food::class, 'HATED_FOODS', 'user_id', 'food_id')
            ->withPivot('note');
    }

    public function eatenFoods(): HasMany
    {
        return $this->hasMany(EatenFood::class, 'user_id', 'user_id');
    }

    public function gachaFoods(): HasMany
    {
        return $this->hasMany(GachaFood::class, 'user_id', 'user_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'author_id', 'user_id');
    }

    public function contributedFoods(): HasMany
    {
        return $this->hasMany(Food::class, 'contributor_id', 'user_id');
    }
}
