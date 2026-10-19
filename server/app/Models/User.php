<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'email',
        'password_hash',
        'display_name',
        'avatar_url',
        'role',
        'status',
    ];

    protected $hidden = [
        'password_hash',
    ];

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function allergyIngredients(): BelongsToMany
    {
        return $this->belongsToMany(
            NutritionIngredient::class,
            'user_allergy_ingredients',
            'user_id',
            'ingredient_id'
        );
    }

    public function dishInteractions(): HasMany
    {
        return $this->hasMany(UserDishInteraction::class, 'user_id', 'id');
    }

    public function favouriteDishes(): BelongsToMany
    {
        return $this->belongsToMany(
            SystemDish::class,
            'user_dish_interactions',
            'user_id',
            'dish_id'
        )->wherePivot('interaction_type', 'FAVOURITE');
    }

    public function dislikedDishes(): BelongsToMany
    {
        return $this->belongsToMany(
            SystemDish::class,
            'user_dish_interactions',
            'user_id',
            'dish_id'
        )->wherePivot('interaction_type', 'DISLIKE');
    }

    public function allergicDishes(): BelongsToMany
    {
        return $this->belongsToMany(
            SystemDish::class,
            'user_dish_interactions',
            'user_id',
            'dish_id'
        )->wherePivot('interaction_type', 'ALLERGY');
    }

    public function communityTopics(): HasMany
    {
        return $this->hasMany(CommunityTopic::class, 'created_by', 'id');
    }

    public function communityPosts(): HasMany
    {
        return $this->hasMany(CommunityPost::class, 'author_id', 'id');
    }

    public function communityComments(): HasMany
    {
        return $this->hasMany(CommunityComment::class, 'user_id', 'id');
    }

    public function submittedReports(): HasMany
    {
        return $this->hasMany(ModerationReport::class, 'reporter_id', 'id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'ADMIN';
    }
}
