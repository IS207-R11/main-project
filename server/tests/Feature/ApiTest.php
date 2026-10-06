<?php

use App\Enums\FoodStatus;
use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Food;
use App\Models\Report;
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

test('signup and signin flow with hashed_password and address', function () {
    $uniqueName = 'user_'.uniqid();
    $uniqueEmail = $uniqueName.'@example.com';

    // Signup
    $signupRes = $this->postJson('/api/auth/signup', [
        'username' => $uniqueName,
        'email' => $uniqueEmail,
        'password' => 'Password123!',
        'address' => '123 Le Loi, Q1, HCMC',
    ]);
    $signupRes->assertStatus(201)
        ->assertJsonStructure(['access_token', 'refresh_token', 'user'])
        ->assertJsonPath('user.address', '123 Le Loi, Q1, HCMC')
        ->assertJsonPath('user.role', 'USER');

    // Signin
    $signinRes = $this->postJson('/api/auth/signin', [
        'username' => $uniqueName,
        'password' => 'Password123!',
    ]);
    $signinRes->assertStatus(200)
        ->assertJsonStructure(['access_token', 'refresh_token', 'user']);

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
        'hashed_password' => Hash::make('Secret123!'),
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

test('change password allows owner with oldPassword and admin without oldPassword', function () {
    $admin = User::create([
        'username' => 'adm_pass_'.uniqid(),
        'email' => 'admpass_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('AdminPass123!'),
        'role' => UserRole::ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);
    $adminToken = $this->jwtService->generateAccessToken($admin);

    $user = User::create([
        'username' => 'passuser_'.uniqid(),
        'email' => 'pass_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('OldSecret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);
    $userToken = $this->jwtService->generateAccessToken($user);

    // Change password as owner (requires correct old password)
    $resFail = $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->postJson('/api/auth/change-password/'.$user->user_id, [
            'oldPassword' => 'WrongPass',
            'newPassword' => 'NewSecret123!',
        ]);
    $resFail->assertStatus(401);

    $resOwner = $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->postJson('/api/auth/change-password/'.$user->user_id, [
            'oldPassword' => 'OldSecret123!',
            'newPassword' => 'NewSecret123!',
        ]);
    $resOwner->assertStatus(200);

    $user->refresh();
    expect(Hash::check('NewSecret123!', $user->hashed_password))->toBeTrue();

    // Admin changes user's password without needing old password
    $resAdmin = $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->postJson('/api/auth/change-password/'.$user->user_id, [
            'newPassword' => 'AdminReset123!',
        ]);
    $resAdmin->assertStatus(200);

    $user->refresh();
    expect(Hash::check('AdminReset123!', $user->hashed_password))->toBeTrue();
});

test('user CRUD profile: user cannot change role, status, created_at, but Admin can change role', function () {
    $admin = User::create([
        'username' => 'adm_mgr_'.uniqid(),
        'email' => 'admmgr_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);
    $adminToken = $this->jwtService->generateAccessToken($admin);

    $target = User::create([
        'username' => 'target_'.uniqid(),
        'email' => 'target_'.uniqid().'@example.com',
        'address' => 'Old Address',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);
    $targetToken = $this->jwtService->generateAccessToken($target);

    // Target updates their own profile (cannot change role or status)
    $updateRes = $this->withHeader('Authorization', 'Bearer '.$targetToken)
        ->putJson('/api/users/'.$target->user_id, [
            'address' => 'New Address 456',
            'role' => 'ADMIN', // Should be ignored
            'status' => 'BANNED', // Should be ignored
        ]);
    $updateRes->assertStatus(200);

    $target->refresh();
    expect($target->address)->toBe('New Address 456');
    expect($target->role->value)->toBe('USER');
    expect($target->status->value)->toBe('ACTIVE');

    // Admin changes role
    $changeRoleRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->putJson('/api/users/'.$target->user_id.'/change-role', [
            'role' => 'MODERATOR',
        ]);
    $changeRoleRes->assertStatus(200);

    $target->refresh();
    expect($target->role->value)->toBe('MODERATOR');

    // Admin changes status
    $changeStatusRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->putJson('/api/users/'.$target->user_id.'/change-status', [
            'status' => 'DISABLED',
        ]);
    $changeStatusRes->assertStatus(200);

    $target->refresh();
    expect($target->status->value)->toBe('DISABLED');
});

test('public foods listing, user PUT pending food, mod approval, and admin delete', function () {
    $admin = User::create([
        'username' => 'adm_food_'.uniqid(),
        'email' => 'admfood_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);
    $adminToken = $this->jwtService->generateAccessToken($admin);

    $moderator = User::create([
        'username' => 'mod_food_'.uniqid(),
        'email' => 'modfood_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::MODERATOR,
        'status' => UserStatus::ACTIVE,
    ]);
    $modToken = $this->jwtService->generateAccessToken($moderator);

    $user = User::create([
        'username' => 'user_food_'.uniqid(),
        'email' => 'userfood_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);
    $userToken = $this->jwtService->generateAccessToken($user);

    // Public list foods (No auth required)
    $publicRes = $this->getJson('/api/foods');
    $publicRes->assertStatus(200);

    // User PUTs new food (default is PENDING)
    $foodPutRes = $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->putJson('/api/foods', [
            'name' => 'Pho Ga '.uniqid(),
            'description' => 'Delicious chicken noodle soup',
            'image_url' => 'https://example.com/phoga.jpg',
        ]);
    $foodPutRes->assertStatus(201)
        ->assertJsonPath('data.status', 'PENDING');
    $foodId = $foodPutRes->json('data.food_id');

    // Moderator approves food (change status to ACTIVE)
    $approveRes = $this->withHeader('Authorization', 'Bearer '.$modToken)
        ->putJson('/api/foods/'.$foodId.'/change-status', [
            'status' => 'ACTIVE',
        ]);
    $approveRes->assertStatus(200)
        ->assertJsonPath('data.status', 'ACTIVE');

    // List check includes is_favorited and is_hated
    $listRes = $this->getJson('/api/foods');
    $listRes->assertStatus(200)
        ->assertJsonStructure(['data' => [['food_id', 'name', 'is_favorited', 'is_hated']]]);

    // Regular user cannot delete food (only Admin)
    $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->deleteJson('/api/foods/'.$foodId)
        ->assertStatus(401);

    // Admin deletes food
    $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->deleteJson('/api/foods/'.$foodId)
        ->assertStatus(200);
});

test('smart gacha ranking with foodSet and excluded eaten/gacha logic', function () {
    $user = User::create([
        'username' => 'gacha_user_'.uniqid(),
        'email' => 'gacha_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);
    $userToken = $this->jwtService->generateAccessToken($user);

    // Create 3 active foods
    $foodA = Food::create([
        'name' => 'Food A '.uniqid(),
        'description' => 'Description for Food A',
        'image_url' => 'https://example.com/food-a.jpg',
        'status' => FoodStatus::ACTIVE,
    ]);
    $foodB = Food::create([
        'name' => 'Food B '.uniqid(),
        'description' => 'Description for Food B',
        'image_url' => 'https://example.com/food-b.jpg',
        'status' => FoodStatus::ACTIVE,
    ]);
    $foodC = Food::create([
        'name' => 'Food C '.uniqid(),
        'description' => 'Description for Food C',
        'image_url' => 'https://example.com/food-c.jpg',
        'status' => FoodStatus::ACTIVE,
    ]);

    // Give Food A high rank: 2 favorites, 1 eaten
    $user->favoriteFoods()->syncWithoutDetaching([$foodA->food_id]);
    $user->eatenFoods()->create(['food_id' => $foodA->food_id, 'created_at' => now()]);

    // Give Food B 1 hated
    $user->hatedFoods()->syncWithoutDetaching([$foodB->food_id]);

    // 1. Gacha with foodSet = [Food A, Food B]
    $gachaFoodSetRes = $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->postJson('/api/foods/gacha', [
            'foodSet' => [$foodA->food_id, $foodB->food_id],
        ]);
    $gachaFoodSetRes->assertStatus(200)
        ->assertJsonStructure(['data' => ['food_id', 'name', 'food_rank', 'is_favorited', 'is_hated']]);
    expect(in_array($gachaFoodSetRes->json('data.food_id'), [$foodA->food_id, $foodB->food_id]))->toBeTrue();

    // 2. Gacha with numberOfExcludedEaten = 1, typeOfExcludedEaten = newest
    // Since Food A is in eaten, Food A must be excluded!
    $gachaExcludeRes = $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->postJson('/api/foods/gacha', [
            'numberOfExcludedEaten' => 1,
            'typeOfExcludedEaten' => 'newest',
            'foodSet' => [$foodA->food_id, $foodC->food_id],
        ]);
    // Note: If foodSet is provided, foodSet is used. Let's test without foodSet:
    $gachaExcludeAllRes = $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->postJson('/api/foods/gacha', [
            'numberOfExcludedEaten' => 1,
            'typeOfExcludedEaten' => 'newest',
        ]);
    $gachaExcludeAllRes->assertStatus(200);
    // Food A was excluded, so winner should not be Food A (it's either Food B, Food C, or others)
    expect($gachaExcludeAllRes->json('data.food_id'))->not->toBe($foodA->food_id);

    // 3. Gacha with excludedGachaSet = true
    \Illuminate\Support\Facades\DB::table('GACHA_FOODS')->upsert([
        'user_id' => $user->user_id,
        'food_id' => $foodB->food_id,
        'created_at' => now(),
    ], ['user_id', 'food_id'], ['created_at']);

    $gachaExcludeGachaRes = $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->postJson('/api/foods/gacha', [
            'excludedGachaSet' => true,
        ]);
    $gachaExcludeGachaRes->assertStatus(200);
    expect($gachaExcludeGachaRes->json('data.food_id'))->not->toBe($foodB->food_id);

    // Clean up
    $foodA->delete();
    $foodB->delete();
    $foodC->delete();
});

test('smart tinder returns list of foods matching filters', function () {
    $user = User::create([
        'username' => 'tinder_user_'.uniqid(),
        'email' => 'tinder_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);
    $userToken = $this->jwtService->generateAccessToken($user);

    $food1 = Food::create([
        'name' => 'Tinder Food 1 '.uniqid(),
        'description' => 'Description 1',
        'image_url' => 'https://example.com/1.jpg',
        'status' => FoodStatus::ACTIVE,
    ]);
    $food2 = Food::create([
        'name' => 'Tinder Food 2 '.uniqid(),
        'description' => 'Description 2',
        'image_url' => 'https://example.com/2.jpg',
        'status' => FoodStatus::ACTIVE,
    ]);

    $res = $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->postJson('/api/foods/tinder', [
            'numberOfResult' => 5,
            'foodSet' => [$food1->food_id, $food2->food_id],
        ]);

    $res->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                ['food_id', 'name', 'status', 'is_favorited', 'is_hated'],
            ],
            'total_records',
        ]);

    $foodIds = collect($res->json('data'))->pluck('food_id')->all();
    expect($foodIds)->toContain($food1->food_id);

    $food1->delete();
    $food2->delete();
});

test('user has full CRUD on EATEN, FAVORITE, HATED of their own, forbidden for other users', function () {
    $user1 = User::create([
        'username' => 'user1_'.uniqid(),
        'email' => 'user1_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);
    $userToken1 = $this->jwtService->generateAccessToken($user1);

    $user2 = User::create([
        'username' => 'user2_'.uniqid(),
        'email' => 'user2_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);
    $userToken2 = $this->jwtService->generateAccessToken($user2);

    $food = Food::create([
        'name' => 'Banh Mi '.uniqid(),
        'description' => 'Crispy bread',
        'image_url' => 'https://example.com/banhmi.jpg',
        'status' => FoodStatus::ACTIVE,
    ]);

    // 1. FAVORITE CRUD
    // Add favorite
    $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->postJson('/api/foods/favorite', [
            'food_id' => $food->food_id,
            'note' => 'Favorite breakfast',
        ])
        ->assertStatus(200);

    // Read favorite (user1 can read, user2 cannot read user1's favorites)
    $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->getJson('/api/foods/favorite/'.$user1->user_id)
        ->assertStatus(200);

    $this->withHeader('Authorization', 'Bearer '.$userToken2)
        ->getJson('/api/foods/favorite/'.$user1->user_id)
        ->assertStatus(401);

    // Update favorite note
    $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->putJson('/api/foods/favorite', [
            'food_id' => $food->food_id,
            'note' => 'Updated favorite note',
        ])
        ->assertStatus(200);

    // Delete favorite
    $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->deleteJson('/api/foods/favorite/'.$food->food_id)
        ->assertStatus(200);

    // 2. HATED CRUD
    // Add hated
    $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->postJson('/api/foods/hated', [
            'food_id' => $food->food_id,
            'note' => 'Do not like herbs',
        ])
        ->assertStatus(200);

    // Read hated
    $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->getJson('/api/foods/hated/'.$user1->user_id)
        ->assertStatus(200);

    $this->withHeader('Authorization', 'Bearer '.$userToken2)
        ->getJson('/api/foods/hated/'.$user1->user_id)
        ->assertStatus(401);

    // Update hated note
    $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->putJson('/api/foods/hated', [
            'food_id' => $food->food_id,
            'note' => 'Severe allergy',
        ])
        ->assertStatus(200);

    // Delete hated
    $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->deleteJson('/api/foods/hated/'.$food->food_id)
        ->assertStatus(200);

    // 3. EATEN CRUD
    // Create eaten
    $eatenRes = $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->postJson('/api/foods/eaten', [
            'food_id' => $food->food_id,
            'note' => 'Ate 1 portion at 8am',
        ]);
    $eatenRes->assertStatus(201);
    $eatenId = $eatenRes->json('data.eaten_id');

    // Read eaten
    $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->getJson('/api/foods/eaten/'.$user1->user_id)
        ->assertStatus(200);

    $this->withHeader('Authorization', 'Bearer '.$userToken2)
        ->getJson('/api/foods/eaten/'.$user1->user_id)
        ->assertStatus(401);

    // Update eaten
    $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->putJson('/api/foods/eaten/'.$eatenId, [
            'note' => 'Updated note: ate 2 portions',
        ])
        ->assertStatus(200);

    // User2 cannot update User1's eaten record
    $this->withHeader('Authorization', 'Bearer '.$userToken2)
        ->putJson('/api/foods/eaten/'.$eatenId, [
            'note' => 'Hacked note',
        ])
        ->assertStatus(403);

    // Delete eaten
    $this->withHeader('Authorization', 'Bearer '.$userToken1)
        ->deleteJson('/api/foods/eaten/'.$eatenId)
        ->assertStatus(200);

    // Clean up
    $food->delete();
});

test('user PUT report and only Admin can change report status', function () {
    $admin = User::create([
        'username' => 'adm_rep_'.uniqid(),
        'email' => 'admrep_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::ADMIN,
        'status' => UserStatus::ACTIVE,
    ]);
    $adminToken = $this->jwtService->generateAccessToken($admin);

    $moderator = User::create([
        'username' => 'mod_rep_'.uniqid(),
        'email' => 'modrep_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::MODERATOR,
        'status' => UserStatus::ACTIVE,
    ]);
    $modToken = $this->jwtService->generateAccessToken($moderator);

    $user = User::create([
        'username' => 'usr_rep_'.uniqid(),
        'email' => 'usrrep_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);
    $userToken = $this->jwtService->generateAccessToken($user);

    // User PUTs new report (default is PENDING)
    $reportRes = $this->withHeader('Authorization', 'Bearer '.$userToken)
        ->putJson('/api/reports', [
            'type' => 'ERROR',
            'title' => 'Cannot search food',
            'content' => 'Search input returns empty',
        ]);
    $reportRes->assertStatus(201)
        ->assertJsonPath('data.status', 'PENDING');
    $reportId = $reportRes->json('data.report_id');

    // Moderator CANNOT change report status (401 or 403)
    $this->withHeader('Authorization', 'Bearer '.$modToken)
        ->putJson('/api/reports/'.$reportId.'/change-status', [
            'status' => 'RESOLVED',
        ])
        ->assertStatus(401);

    // Admin can change report status to RESOLVED
    $resolveRes = $this->withHeader('Authorization', 'Bearer '.$adminToken)
        ->putJson('/api/reports/'.$reportId.'/change-status', [
            'status' => 'RESOLVED',
        ]);
    $resolveRes->assertStatus(200)
        ->assertJsonPath('data.status', 'RESOLVED')
        ->assertJsonPath('data.resolved_by.user_id', $admin->user_id);
});
