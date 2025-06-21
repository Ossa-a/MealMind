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
        Schema::create('meal_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meal_plan_id')->constrained()->onDelete('cascade');
            $table->foreignId('meal_id')->constrained()->onDelete('cascade');
            $table->integer('day_of_week')->comment('1 = Monday, 7 = Sunday');
            $table->enum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']);
            $table->timestamps();

            // Add a unique constraint to prevent duplicate meals for the same day and type
            $table->unique(['meal_plan_id', 'day_of_week', 'meal_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meal_plan_items');
    }
}; 