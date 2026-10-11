<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class GachaFood extends Model
{
    use HasFactory;

    protected $table = 'GACHA_FOODS';

    public $incrementing = false;

    public $timestamps = false;

    protected $primaryKey = null;

    protected $fillable = [
        'user_id',
        'food_id',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function food(): BelongsTo
    {
        return $this->belongsTo(Food::class, 'food_id', 'food_id');
    }

    /**
     * Ghi nhận lượt gacha vào GACHA_FOODS cho mỗi user.
     * Quy tắc:
     * - Nếu user đã có từ 5 dòng trở lên và đây là món mới, drop dòng cũ nhất trước khi thêm.
     * - Các trường hợp khác: bỏ qua, insert/update bình thường.
     * - Duy trì table ở tối đa 5 dòng cho mỗi user.
     */
    public static function recordGacha(int $userId, int $foodId): void
    {
        DB::transaction(function () use ($userId, $foodId) {
            $alreadyExists = DB::table('GACHA_FOODS')
                ->where('user_id', $userId)
                ->where('food_id', $foodId)
                ->exists();

            if (! $alreadyExists) {
                $count = DB::table('GACHA_FOODS')
                    ->where('user_id', $userId)
                    ->count();

                if ($count >= 5) {
                    $numToDelete = $count - 4; // Nếu có 5 dòng -> xóa 1 dòng cũ nhất để còn 4 dòng trước khi insert
                    $oldestFoodIds = DB::table('GACHA_FOODS')
                        ->where('user_id', $userId)
                        ->orderBy('created_at', 'asc')
                        ->orderBy('food_id', 'asc')
                        ->limit($numToDelete)
                        ->pluck('food_id');

                    if ($oldestFoodIds->isNotEmpty()) {
                        DB::table('GACHA_FOODS')
                            ->where('user_id', $userId)
                            ->whereIn('food_id', $oldestFoodIds)
                            ->delete();
                    }
                }
            }

            DB::table('GACHA_FOODS')->upsert(
                [
                    'user_id' => $userId,
                    'food_id' => $foodId,
                    'created_at' => now(),
                ],
                ['user_id', 'food_id'],
                ['created_at']
            );
        });
    }
}
