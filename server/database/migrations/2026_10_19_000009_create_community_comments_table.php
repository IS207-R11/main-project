<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('community_comments')) {
            Schema::create('community_comments', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedInteger('post_id');
                $table->unsignedInteger('user_id');
                $table->unsignedInteger('parent_comment_id')->nullable()->comment('Hỗ trợ reply dạng nhánh');
                $table->text('content');
                $table->json('image_url')->nullable()->comment('Ảnh thực hành (Cooksnap)');
                $table->string('status', 20)->default('PUBLISHED')->comment('PUBLISHED, HIDDEN, DELETED');
                $table->timestamps();

                $table->foreign('post_id')->references('id')->on('community_posts')->onDelete('cascade');
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('parent_comment_id')->references('id')->on('community_comments')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('community_comments');
    }
};

