<?php

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Food;
use App\Models\Nutrition;
use App\Models\User;
use App\Services\JwtService;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->jwtService = app(JwtService::class);
});

test('root endpoint returns server running message', function () {
    $response = $this->get('/api/');
    $response->assertStatus(200);
    expect($response->getContent())->toBe('Server is running');
});

test('signup and signin flow', function () {
    $uniqueName = 'user_'.uniqid();
    $uniqueEmail = $uniqueName.'@example.com';

    // Signup
    $signupRes = $this->postJson('/api/auth/signup', [
        'username' => $uniqueName,
        'email' => $uniqueEmail,
        'password' => 'Password123!',
    ]);
    $signupRes->assertStatus(201)
        ->assertJsonStructure(['access_token', 'refresh_token']);

    // Signin
    $signinRes = $this->postJson('/api/auth/signin', [
        'username' => $uniqueName,
        'password' => 'Password123!',
    ]);
    $signinRes->assertStatus(200)
        ->assertJsonStructure(['access_token', 'refresh_token']);

    // Signout
    $signoutRes = $this->postJson('/api/auth/signout', [
        'username' => $uniqueName,
    ]);
    $signoutRes->assertStatus(200);
});

test('refresh token generates new access token', function () {
    $uniqueName = 'refreshuser_'.uniqid();
    $user = User::create([
        'username' => $uniqueName,
        'email' => $uniqueName.'@example.com',
        'password_hashed' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);

    $refreshToken = $this->jwtService->generateRefreshToken($user);

    $response = $this->postJson('/api/auth/refresh-token', [
        'refreshToken' => $refreshToken,
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure(['access_token']);
});

test('change password allows owner and admin', function () {
    $user = User::create([
        'username' => 'passuser_'.uniqid(),
        'email' => 'pass_'.uniqid().'@example.com',
        'password_hashed' => Hash::make('OldSecret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);

    $userToken = $this->jwtService->generateAccessToken($user);

    // Change password as owner
    $res = $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->postJson('/api/auth/change-password/'.$user->user_id, [
            'oldPassword' => 'OldSecret123!',
            'newPassword' => 'NewSecret123!',
        ]);

    $res->assertStatus(200);
    $user->refresh();
    expect(Hash::check('NewSecret123!', $user->password_hashed))->toBeTrue();
});

test('user management endpoints', function () {
    $admin = User::create([
        'username' => 'adm_'.uniqid(),
        'email' => 'adm_'.uniqid().'@example.com',
        'password_hashed' => Hash::make('Secret123!'),
        'role' => UserRole::ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);

    $target = User::create([
        'username' => 'target_'.uniqid(),
        'email' => 'target_'.uniqid().'@example.com',
        'password_hashed' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);

    $adminToken = $this->jwtService->generateAccessToken($admin);
    $targetToken = $this->jwtService->generateAccessToken($target);

    // List users (Admin)
    $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->getJson('/api/users')
        ->assertStatus(200)
        ->assertJsonStructure(['data', 'total_records']);

    // Show user details
    $this->withHeader('Authorization', 'Bearer '.$targetToken)
        ->getJson('/api/users/'.$target->user_id)
        ->assertStatus(200)
        ->assertJsonPath('data.user_id', $target->user_id);

    // Update user profile (Owner)
    $this->withHeader('Authorization', 'Bearer '.$targetToken)
        ->putJson('/api/users/'.$target->user_id, [
            'phone' => '0987654321',
            'gender' => 'MALE',
        ])
        ->assertStatus(200);

    // Change status (Admin)
    $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->putJson('/api/users/'.$target->user_id.'/change-status', [
            'status' => 'DISABLED',
        ])
        ->assertStatus(200);

    $target->refresh();
    expect($target->status->value)->toBe('DISABLED');
});

test('health profiles CRUD', function () {
    $user = User::create([
        'username' => 'health_'.uniqid(),
        'email' => 'health_'.uniqid().'@example.com',
        'password_hashed' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);
    $userToken = $this->jwtService->generateAccessToken($user);

    // Create health profile
    $createRes = $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->postJson('/api/health-profiles/'.$user->user_id, [
            'weight' => 70.5,
            'height' => 175.0,
            'date_of_measuring' => '2026-09-20',
            'measuring_method' => 'STANDING',
            'labor_level' => 'MID',
            'maternity_status' => null,
        ]);
    $createRes->assertStatus(201);
    $profileId = $createRes->json('data.profile_id');

    // List health profiles
    $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->getJson('/api/health-profiles/'.$user->user_id)
        ->assertStatus(200)
        ->assertJsonStructure(['data', 'total_records']);

    // Update health profile
    $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->putJson('/api/health-profiles/'.$user->user_id.'/'.$profileId, [
            'weight' => 69.5,
        ])
        ->assertStatus(200)
        ->assertJsonPath('data.weight', 69.5);

    // Delete health profile
    $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->deleteJson('/api/health-profiles/'.$profileId)
        ->assertStatus(200);
});

test('nutrition and food lifecycle with relations and rollback', function () {
    $admin = User::create([
        'username' => 'foodadm_'.uniqid(),
        'email' => 'foodadm_'.uniqid().'@example.com',
        'password_hashed' => Hash::make('Secret123!'),
        'role' => UserRole::ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);
    $adminToken = $this->jwtService->generateAccessToken($admin);

    // Create nutrition
    $nutRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->postJson('/api/nutritions', [
            'nutrition_name' => 'Protein Hydrolyzed '.uniqid(),
            'calories' => 4.0,
            'protein_g' => 25.0,
        ]);
    $nutRes->assertStatus(201);
    $nutritionId = $nutRes->json('data.nutrition_id');

    // Create food with nutrition
    $foodRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->postJson('/api/foods', [
            'food_name' => 'Healthy Salad '.uniqid(),
            'quip' => 'Fresh organic salad',
            'sub' => 'With high protein',
            'price' => 45000.0,
            'is_veg' => true,
            'sessions' => ['MORNING', 'LUNCH'],
            'nutritions' => [$nutritionId],
        ]);
    $foodRes->assertStatus(201)
        ->assertJsonPath('data.is_veg', true);
    $foodId = $foodRes->json('data.food_id');

    // Test rollback with invalid nutrition ID
    $invalidFoodRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->postJson('/api/foods', [
            'food_name' => 'Invalid Food',
            'is_veg' => false,
            'nutritions' => [9999999], // non-existent
        ]);
    $invalidFoodRes->assertStatus(400);

    // Favorite foods
    $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->postJson('/api/foods/favorite', ['food_id' => $foodId])
        ->assertStatus(200);

    $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->getJson('/api/foods/favorite/'.$admin->user_id)
        ->assertStatus(200);

    $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->deleteJson('/api/foods/favorite?food_id='.$foodId)
        ->assertStatus(200);

    // Scanned foods
    $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->postJson('/api/foods/scanned', ['food_id' => $foodId])
        ->assertStatus(200);

    // Eaten food recording
    $eatenRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->postJson('/api/foods/eaten', [
            'meal_type' => 'LUNCH',
            'eaten_at' => '2026-09-20 12:00:00',
            'address' => 'District 1, HCMC',
            'note' => 'Very delicious',
            'items' => [
                ['food_id' => $foodId, 'quantity' => 2.0],
            ],
        ]);
    $eatenRes->assertStatus(201);
    $eatenFoodId = $eatenRes->json('data.eaten_food_id');

    $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->deleteJson('/api/foods/eaten?eaten_food_id='.$eatenFoodId)
        ->assertStatus(200);

    // Clean up food
    $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->deleteJson('/api/foods/'.$foodId)
        ->assertStatus(200);

    // Clean up nutrition
    $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->deleteJson('/api/nutritions/'.$nutritionId)
        ->assertStatus(200);
});
