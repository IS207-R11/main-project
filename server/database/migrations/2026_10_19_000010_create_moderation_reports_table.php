<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('moderation_reports')) {
            Schema::create('moderation_reports', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedInteger('reporter_id');
                $table->string('target_type', 20)->comment('POST, COMMENT');
                $table->unsignedInteger('target_id')->comment('ID của post hoặc comment tương ứng');
                $table->string('reason', 100)->comment('Spam, Thù địch, Không liên quan, Phản cảm, Độc hại');
                $table->text('description')->nullable();
                $table->string('status', 20)->default('PENDING')->comment('PENDING, RESOLVED, DISMISSED');
                $table->unsignedInteger('reviewed_by')->nullable()->comment('Admin xử lý');
                $table->timestamps();

                $table->foreign('reporter_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('reviewed_by')->references('id')->on('users')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('moderation_reports');
    }
};

