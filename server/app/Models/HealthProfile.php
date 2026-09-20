<?php

namespace App\Models;

use App\Enums\LaborLevel;
use App\Enums\MaternityStatus;
use App\Enums\MeasuringMethod;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HealthProfile extends Model
{
    use HasFactory;

    protected $table = 'HEALTH_PROFILES';

    protected $primaryKey = 'profile_id';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'weight',
        'height',
        'date_of_measuring',
        'measuring_method',
        'labor_level',
        'maternity_status',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'decimal:2',
            'height' => 'decimal:2',
            'date_of_measuring' => 'date:Y-m-d',
            'measuring_method' => MeasuringMethod::class,
            'labor_level' => LaborLevel::class,
            'maternity_status' => MaternityStatus::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
