<?php

namespace App\Models;

use App\Enums\Gender;
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
        'role',
        'email',
        'username',
        'password_hashed',
        'status',
        'date_of_birth',
        'phone',
        'avatar_url',
        'gender',
    ];

    protected $hidden = [
        'password_hashed',
    ];

    /**
     * Get the password for the user.
     */
    public function getAuthPassword(): string
    {
        return $this->password_hashed;
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
            'gender' => Gender::class,
            'date_of_birth' => 'date:Y-m-d',
            'created_at' => 'date:Y-m-d',
        ];
    }

    public function healthProfiles(): HasMany
    {
        return $this->hasMany(HealthProfile::class, 'user_id', 'user_id');
    }

    public function favoriteFoods(): BelongsToMany
    {
        return $this->belongsToMany(Food::class, 'FAVORITE_FOODS', 'user_id', 'food_id');
    }

    public function scannedFoods(): BelongsToMany
    {
        return $this->belongsToMany(Food::class, 'SCANNED_FOODS', 'user_id', 'food_id');
    }

    public function eatenFoods(): HasMany
    {
        return $this->hasMany(EatenFood::class, 'user_id', 'user_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'author_id', 'user_id');
    }
}
