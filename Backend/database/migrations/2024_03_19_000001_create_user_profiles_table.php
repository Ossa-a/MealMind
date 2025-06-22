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
            $table->text('goals');
            $table->string('diet_type')->nullable();
            $table->json('allergies')->nullable();
            $table->integer('daily_calories_target')->nullable();
            $table->float('weight');
            $table->float('height');
            $table->enum('activity_level', ['sedentary', 'light', 'moderate', 'very active', 'extra active']);
            $table->enum('gender', ['male', 'female', 'other']);
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