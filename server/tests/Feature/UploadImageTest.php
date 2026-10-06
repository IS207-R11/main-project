<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Http\UploadedFile;

beforeEach(function () {
    $this->jwtService = app(JwtService::class);

    $this->testUser = User::create([
        'username' => 'upload_user_'.uniqid(),
        'email' => 'upload_'.uniqid().'@example.com',
        'hashed_password' => bcrypt('Password123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);

    $this->token = $this->jwtService->generateAccessToken($this->testUser);
});

afterEach(function () {
    if (isset($this->testUser)) {
        $this->testUser->delete();
    }
});

test('unauthenticated request to upload image is rejected with 401', function () {
    $file = UploadedFile::fake()->image('food.jpg', 600, 400);

    $response = $this->postJson('/api/upload/image', [
        'image' => $file,
    ]);

    $response->assertStatus(401);
});

test('upload image rejects non-image file with 422', function () {
    $file = UploadedFile::fake()->create('document.pdf', 500, 'application/pdf');

    $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
        ->postJson('/api/upload/image', [
            'image' => $file,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['image']);
});

test('upload image rejects file larger than 5MB with 422', function () {
    // 5.5MB = 5632 KB
    $oversizedFile = UploadedFile::fake()->image('large_food.jpg')->size(5632);

    $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
        ->postJson('/api/upload/image', [
            'image' => $oversizedFile,
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['image']);
});
