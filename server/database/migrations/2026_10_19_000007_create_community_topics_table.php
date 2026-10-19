<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('community_topics')) {
            Schema::create('community_topics', function (Blueprint $table) {
                $table->increments('id');
                $table->string('title', 255);
                $table->string('slug', 255)->unique();
                $table->text('description')->nullable();
                $table->string('cover_image', 500)->nullable();
                $table->unsignedInteger('created_by')->nullable();
                $table->integer('post_count')->default(0);
                $table->timestamps();

                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('community_topics');
    }
};

