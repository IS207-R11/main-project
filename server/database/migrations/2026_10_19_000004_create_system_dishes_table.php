<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('system_dishes')) {
            Schema::create('system_dishes', function (Blueprint $table) {
                $table->increments('id');
                $table->string('title', 255);
                $table->string('slug', 255)->unique();
                $table->string('image_url', 500)->nullable();
                $table->text('instructions');
                $table->decimal('total_calo', 8, 2)->default(0.00);
                $table->integer('favourite_count')->default(0)->comment('Công khai cho toàn bộ User');
                $table->string('source_url', 500)->nullable()->comment('Link nguồn Ajinomoto');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_dishes');
    }
};

