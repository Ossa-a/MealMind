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
            $table->enum('goals', ['lose_weight', 'gain_muscle', 'maintain_weight']);
            $table->string('diet_type');
            $table->json('allergies')->nullable();
            $table->integer('daily_calories_target');
            $table->float('weight');
            $table->float('height');
            $table->enum('activity_level', ['sedentary', 'light', 'moderate', 'very active', 'extra active']);
            $table->enum('gender', ['male', 'female']);
            $table->date('date_of_birth');
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