<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('system_dish_ingredients')) {
            Schema::create('system_dish_ingredients', function (Blueprint $table) {
                $table->unsignedInteger('dish_id');
                $table->unsignedInteger('ingredient_id');
                $table->string('quantity_display', 100)->comment('VD: 2 muỗng canh, 1/2 củ, 350 gram');
                $table->decimal('weight_in_grams', 8, 2)->comment('Khối lượng đã quy đổi ra gram');

                $table->primary(['dish_id', 'ingredient_id']);
                $table->foreign('dish_id')->references('id')->on('system_dishes')->onDelete('cascade');
                $table->foreign('ingredient_id')->references('id')->on('nutrition_ingredients')->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_dish_ingredients');
    }
};

