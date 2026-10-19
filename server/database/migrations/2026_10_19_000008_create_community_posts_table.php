<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('community_posts')) {
            Schema::create('community_posts', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedInteger('topic_id');
                $table->unsignedInteger('author_id');
                $table->string('title', 255);
                $table->text('story')->nullable();
                $table->integer('servings')->default(1);
                $table->string('cook_time', 50)->nullable();
                $table->json('ingredients_json')->comment('Danh sách nguyên liệu dạng chữ do user tự nhập');
                $table->json('steps_json')->comment('Các bước thực hiện kèm ảnh/video');
                $table->string('status', 20)->default('PUBLISHED')->comment('PUBLISHED, HIDDEN, DELETED');
                $table->timestamps();

                $table->foreign('topic_id')->references('id')->on('community_topics')->onDelete('cascade');
                $table->foreign('author_id')->references('id')->on('users')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('community_posts');
    }
};

