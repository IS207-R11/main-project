<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('user_dish_interactions')) {
            Schema::create('user_dish_interactions', function (Blueprint $table) {
                $table->unsignedInteger('user_id');
                $table->unsignedInteger('dish_id');
                $table->string('interaction_type', 20)->comment('FAVOURITE, DISLIKE, ALLERGY');
                $table->timestamp('created_at')->useCurrent();

                $table->primary(['user_id', 'dish_id', 'interaction_type']);
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('dish_id')->references('id')->on('system_dishes')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_dish_interactions');
    }
};

