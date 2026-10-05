<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FoodController;
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

    Route::middleware(['jwt.auth'])->group(function () {
        Route::post('/change-password/{userID}', [AuthController::class, 'changePassword']);
    });
});

// User Management Routes
Route::prefix('users')->group(function () {
    Route::middleware(['jwt.auth'])->group(function () {
        Route::get('/', [UserController::class, 'index'])->middleware('role:ADMIN,MODERATOR');
        Route::get('/{id}', [UserController::class, 'show'])->middleware('owner:ADMIN,MODERATOR')->whereNumber('id');
        Route::put('/{id}', [UserController::class, 'update'])->middleware('owner:ADMIN')->whereNumber('id');
        Route::put('/{id}/change-role', [UserController::class, 'changeRole'])->middleware('role:ADMIN')->whereNumber('id');
        Route::put('/{id}/change-status', [UserController::class, 'changeStatus'])->middleware('role:ADMIN,MODERATOR')->whereNumber('id');
        Route::delete('/{id}', [UserController::class, 'destroy'])->middleware('owner:ADMIN')->whereNumber('id');
    });
});

// Foods Routes
Route::prefix('foods')->group(function () {
    // Public routes
    Route::get('/', [FoodController::class, 'index']);
    Route::get('/options', [FoodController::class, 'options']);
    Route::match(['get', 'post'], '/gacha', [FoodController::class, 'gacha']);
    Route::get('/{foodId}', [FoodController::class, 'show'])->whereNumber('foodId');

    // Authenticated routes
    Route::middleware(['jwt.auth'])->group(function () {
        // User collections routes (FAVORITE - only owner has full CRUD)
        Route::get('/favorite/{userId}', [FoodController::class, 'getFavorites'])->middleware('owner')->whereNumber('userId');
        Route::post('/favorite', [FoodController::class, 'addFavorite']);
        Route::put('/favorite', [FoodController::class, 'updateFavorite']);
        Route::delete('/favorite/{foodId}', [FoodController::class, 'removeFavorite'])->whereNumber('foodId');
        Route::delete('/favorite', [FoodController::class, 'removeFavorite']);

        // User collections routes (HATED - only owner has full CRUD)
        Route::get('/hated/{userId}', [FoodController::class, 'getHated'])->middleware('owner')->whereNumber('userId');
        Route::post('/hated', [FoodController::class, 'addHated']);
        Route::put('/hated', [FoodController::class, 'updateHated']);
        Route::delete('/hated/{foodId}', [FoodController::class, 'removeHated'])->whereNumber('foodId');
        Route::delete('/hated', [FoodController::class, 'removeHated']);

        // User collections routes (EATEN - only owner has full CRUD)
        Route::get('/eaten/{userId}', [FoodController::class, 'getEaten'])->middleware('owner')->whereNumber('userId');
        Route::post('/eaten', [FoodController::class, 'addEaten']);
        Route::put('/eaten/{eatenId}', [FoodController::class, 'updateEaten'])->whereNumber('eatenId');
        Route::delete('/eaten/{eatenId}', [FoodController::class, 'removeEaten'])->whereNumber('eatenId');
        Route::delete('/eaten', [FoodController::class, 'removeEaten']);

        // Food item creation: User can only PUT new food, default status is PENDING
        Route::put('/', [FoodController::class, 'store']);
        Route::post('/', [FoodController::class, 'store']); // Alias for backward compatibility

        // Moderator / Admin food moderation
        Route::put('/{foodId}/change-status', [FoodController::class, 'changeStatus'])->middleware('role:ADMIN,MODERATOR')->whereNumber('foodId');

        // Admin-only food management
        Route::put('/{foodId}', [FoodController::class, 'update'])->middleware('role:ADMIN')->whereNumber('foodId');
        Route::delete('/{foodId}', [FoodController::class, 'destroy'])->middleware('role:ADMIN')->whereNumber('foodId');
    });
});

// Reports Routes
Route::prefix('reports')->group(function () {
    Route::middleware(['jwt.auth'])->group(function () {
        // Admin and Moderator can view reports
        Route::get('/', [ReportController::class, 'index'])->middleware('role:ADMIN,MODERATOR');

        // User can only PUT report (default status is PENDING)
        Route::put('/', [ReportController::class, 'store']);
        Route::post('/', [ReportController::class, 'store']); // Alias for backward compatibility

        // Only Admin can change report status
        Route::put('/{reportId}/change-status', [ReportController::class, 'changeStatus'])->middleware('role:ADMIN')->whereNumber('reportId');
    });
});
