<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->increments('id');
                $table->string('email', 255)->unique();
                $table->string('password_hash', 255);
                $table->string('display_name', 100);
                $table->string('avatar_url', 500)->nullable();
                $table->string('role', 20)->default('USER')->comment('USER, ADMIN');
                $table->string('status', 20)->default('ACTIVE')->comment('ACTIVE, BANNED');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

