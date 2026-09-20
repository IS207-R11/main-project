<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FoodController;
use App\Http\Controllers\Api\HealthProfileController;
use App\Http\Controllers\Api\NutritionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RootController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Root status check
Route::get('/', [RootController::class, 'index']);

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/signin', [AuthController::class, 'signin']);
    Route::post('/signup', [AuthController::class, 'signup']);
    Route::post('/signout', [AuthController::class, 'signout']);
    Route::post('/refresh-token', [AuthController::class, 'refreshToken']);

    Route::middleware(['jwt.auth', 'owner:ADMIN'])->group(function () {
        Route::post('/change-password/{userID}', [AuthController::class, 'changePassword']);
    });
});

// User Management Routes
Route::prefix('users')->group(function () {
    Route::middleware(['jwt.auth'])->group(function () {
        Route::get('/', [UserController::class, 'index'])->middleware('role:ADMIN,MODERATOR');
        Route::get('/{id}', [UserController::class, 'show'])->middleware('owner:ADMIN,MODERATOR')->whereNumber('id'); // whereNumber --> cast to number
        Route::put('/{id}', [UserController::class, 'update'])->middleware('owner')->whereNumber('id');
        Route::put('/{id}/change-status', [UserController::class, 'changeStatus'])->middleware('role:ADMIN,MODERATOR')->whereNumber('id');
        Route::delete('/{id}', [UserController::class, 'destroy'])->middleware('owner:ADMIN')->whereNumber('id');
    });
});

// Health Profiles Routes
Route::prefix('health-profiles')->group(function () {
    Route::middleware(['jwt.auth'])->group(function () {
        Route::get('/{userId}', [HealthProfileController::class, 'index'])->middleware('owner:ADMIN')->whereNumber('userId');
        Route::post('/{userId}', [HealthProfileController::class, 'store'])->middleware('owner')->whereNumber('userId');
        Route::put('/{userId}/{profileId}', [HealthProfileController::class, 'update'])->middleware('owner')->whereNumber('userId')->whereNumber('profileId');
        Route::delete('/{profileId}', [HealthProfileController::class, 'destroy'])->middleware('owner:ADMIN')->whereNumber('profileId');
    });
});
// Legacy alias for typo compatibility if requested
Route::delete('/heal-profiles/{profileId}', [HealthProfileController::class, 'destroy'])->middleware(['jwt.auth', 'owner:ADMIN'])->whereNumber('profileId');

// Foods Routes
Route::prefix('foods')->group(function () {
    // Public routes
    Route::get('/', [FoodController::class, 'index']);
    Route::get('/options', [FoodController::class, 'options']);
    Route::get('/gacha', [FoodController::class, 'gacha']);

    // Authenticated routes
    Route::middleware(['jwt.auth'])->group(function () {
        // User collections routes (placed before {foodId})
        Route::get('/favorite/{userId}', [FoodController::class, 'getFavorites'])->middleware('owner:ADMIN')->whereNumber('userId');
        Route::get('/scanned/{userId}', [FoodController::class, 'getScanned'])->middleware('owner:ADMIN')->whereNumber('userId');
        Route::get('/eaten/{userId}', [FoodController::class, 'getEaten'])->middleware('owner:ADMIN')->whereNumber('userId');

        Route::post('/favorite', [FoodController::class, 'addFavorite'])->middleware('owner');
        Route::post('/scanned', [FoodController::class, 'addScanned'])->middleware('owner');
        Route::post('/eaten', [FoodController::class, 'addEaten'])->middleware('owner');

        Route::delete('/favorite', [FoodController::class, 'removeFavorite'])->middleware('owner');
        Route::delete('/eaten', [FoodController::class, 'removeEaten'])->middleware('owner');

        // Food item specific routes
        Route::post('/', [FoodController::class, 'store'])->middleware('role:USER,ADMIN');
        Route::put('/{foodId}', [FoodController::class, 'update'])->middleware('role:ADMIN')->whereNumber('foodId');
        Route::delete('/{foodId}', [FoodController::class, 'destroy'])->middleware('role:ADMIN')->whereNumber('foodId');
        Route::put('/{foodId}/change-status', [FoodController::class, 'changeStatus'])->middleware('role:ADMIN,MODERATOR')->whereNumber('foodId');
    });
});

// Nutrition Routes
Route::prefix('nutritions')->group(function () {
    // Public routes
    Route::get('/', [NutritionController::class, 'index']);
    Route::get('/options', [NutritionController::class, 'options']);
    Route::get('/{nutritionId}', [NutritionController::class, 'show'])->whereNumber('nutritionId');

    // Authenticated routes
    Route::middleware(['jwt.auth'])->group(function () {
        Route::post('/', [NutritionController::class, 'store'])->middleware('role:USER,ADMIN');
        Route::put('/{nutritionId}', [NutritionController::class, 'update'])->middleware('role:ADMIN')->whereNumber('nutritionId');
        Route::delete('/{nutritionId}', [NutritionController::class, 'destroy'])->middleware('role:ADMIN')->whereNumber('nutritionId');
    });
});

// Reports Routes
Route::prefix('reports')->group(function () {
    Route::middleware(['jwt.auth'])->group(function () {
        Route::get('/', [ReportController::class, 'index'])->middleware('role:ADMIN,MODERATOR');
        Route::post('/', [ReportController::class, 'store'])->middleware('role:USER,ADMIN,MODERATOR');
        Route::put('/{reportId}/change-status', [ReportController::class, 'changeStatus'])->middleware('role:ADMIN,MODERATOR')->whereNumber('reportId');
    });
});
