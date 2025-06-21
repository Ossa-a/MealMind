<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('goals')->nullable();
            $table->string('diet_type')->nullable();
            $table->json('allergies')->nullable();
            $table->integer('daily_calories_target')->nullable();
            $table->float('weight')->nullable();
            $table->float('height')->nullable();
            $table->enum('activity_level', ['sedentary', 'light', 'moderate', 'very_active'])->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->date('date_of_birth')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
}; 