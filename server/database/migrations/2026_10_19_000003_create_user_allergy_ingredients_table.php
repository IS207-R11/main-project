<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('user_allergy_ingredients')) {
            Schema::create('user_allergy_ingredients', function (Blueprint $table) {
                $table->unsignedInteger('user_id');
                $table->unsignedInteger('ingredient_id');

                $table->primary(['user_id', 'ingredient_id']);
                $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('ingredient_id')->references('id')->on('nutrition_ingredients')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_allergy_ingredients');
    }
};

