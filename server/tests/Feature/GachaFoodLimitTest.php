<?php

use App\Enums\FoodStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Food;
use App\Models\GachaFood;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

test('GACHA_FOODS limits to maximum 5 records per user and drops oldest on insert', function () {
    // 1. Tạo user test
    $user = User::create([
        'username' => 'gacha_limit_'.uniqid(),
        'email' => 'gacha_limit_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);

    // Tạo user khác để đảm bảo không ảnh hưởng giữa các user
    $otherUser = User::create([
        'username' => 'other_user_'.uniqid(),
        'email' => 'other_'.uniqid().'@example.com',
        'hashed_password' => Hash::make('Secret123!'),
        'role' => UserRole::USER,
        'status' => UserStatus::ACTIVE,
    ]);

    // 2. Tạo 7 món ăn
    $foods = [];
    for ($i = 1; $i <= 7; $i++) {
        $foods[$i] = Food::create([
            'name' => "Food {$i} ".uniqid(),
            'description' => "Description for Food {$i}",
            'image_url' => "https://example.com/food-{$i}.jpg",
            'status' => FoodStatus::ACTIVE,
        ]);
    }

    try {
        // Ghi nhận món cho otherUser
        GachaFood::recordGacha($otherUser->user_id, $foods[1]->food_id);

        // A. Thêm lần lượt 3 món đầu tiên (nhỏ hơn 5): thêm bình thường
        GachaFood::recordGacha($user->user_id, $foods[1]->food_id);
        sleep(1);
        GachaFood::recordGacha($user->user_id, $foods[2]->food_id);
        sleep(1);
        GachaFood::recordGacha($user->user_id, $foods[3]->food_id);

        $count = DB::table('GACHA_FOODS')->where('user_id', $user->user_id)->count();
        expect($count)->toBe(3);

        // B. Thêm món thứ 4 và thứ 5: đạt mốc 5 dòng
        sleep(1);
        GachaFood::recordGacha($user->user_id, $foods[4]->food_id);
        sleep(1);
        GachaFood::recordGacha($user->user_id, $foods[5]->food_id);

        $count = DB::table('GACHA_FOODS')->where('user_id', $user->user_id)->count();
        expect($count)->toBe(5);

        // C. Thêm món thứ 6 (món mới): dòng cũ nhất (Food 1) phải bị xóa, duy trì 5 dòng
        sleep(1);
        GachaFood::recordGacha($user->user_id, $foods[6]->food_id);

        $userFoodIds = DB::table('GACHA_FOODS')
            ->where('user_id', $user->user_id)
            ->pluck('food_id')
            ->all();

        expect(count($userFoodIds))->toBe(5)
            ->and($userFoodIds)->not->toContain($foods[1]->food_id)
            ->and($userFoodIds)->toContain($foods[2]->food_id)
            ->and($userFoodIds)->toContain($foods[3]->food_id)
            ->and($userFoodIds)->toContain($foods[4]->food_id)
            ->and($userFoodIds)->toContain($foods[5]->food_id)
            ->and($userFoodIds)->toContain($foods[6]->food_id);

        // D. Gacha lại món đã có trong danh sách (Food 4):
        // Không xóa món nào, cập nhật created_at của Food 4 lên mới nhất
        sleep(1);
        GachaFood::recordGacha($user->user_id, $foods[4]->food_id);

        $userFoodIdsAfterUpdate = DB::table('GACHA_FOODS')
            ->where('user_id', $user->user_id)
            ->pluck('food_id')
            ->all();

        expect(count($userFoodIdsAfterUpdate))->toBe(5)
            ->and($userFoodIdsAfterUpdate)->toContain($foods[4]->food_id);

        // E. Thêm món thứ 7 (món mới): bây giờ dòng cũ nhất tiếp theo là Food 2 sẽ bị xóa
        sleep(1);
        GachaFood::recordGacha($user->user_id, $foods[7]->food_id);

        $userFoodIdsFinal = DB::table('GACHA_FOODS')
            ->where('user_id', $user->user_id)
            ->pluck('food_id')
            ->all();

        expect(count($userFoodIdsFinal))->toBe(5)
            ->and($userFoodIdsFinal)->not->toContain($foods[2]->food_id)
            ->and($userFoodIdsFinal)->toContain($foods[7]->food_id);

        // F. Kiểm tra dữ liệu của otherUser không bị ảnh hưởng
        $otherCount = DB::table('GACHA_FOODS')->where('user_id', $otherUser->user_id)->count();
        expect($otherCount)->toBe(1);

    } finally {
        // Cleanup test data
        DB::table('GACHA_FOODS')->whereIn('user_id', [$user->user_id, $otherUser->user_id])->delete();
        foreach ($foods as $food) {
            $food->delete();
        }
        $user->delete();
        $otherUser->delete();
    }
});
