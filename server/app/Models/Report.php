<?php

namespace App\Models;

use App\Enums\ReportStatus;
use App\Enums\ReportType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Report extends Model
{
    use HasFactory;

    protected $table = 'REPORTS';

    protected $primaryKey = 'report_id';

    public $timestamps = false;

    protected $fillable = [
        'author_id',
        'type',
        'status',
        'title',
        'content',
        'resolved_by',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => ReportType::class,
            'status' => ReportStatus::class,
            'resolved_at' => 'date:Y-m-d',
            'created_at' => 'date:Y-m-d',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id', 'user_id');
    }

    public function resolvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by', 'user_id');
    }
}
