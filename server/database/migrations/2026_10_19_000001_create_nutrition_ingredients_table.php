<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('nutrition_ingredients')) {
            Schema::create('nutrition_ingredients', function (Blueprint $table) {
                $table->increments('id');
                $table->string('name', 255);
                $table->decimal('calo_per_100g', 8, 2)->comment('Kcal');
                $table->decimal('refuse_rate', 5, 2)->default(0.00)->comment('Tỷ lệ thải bỏ (%)');
                $table->timestamp('created_at')->useCurrent();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('nutrition_ingredients');
    }
};

