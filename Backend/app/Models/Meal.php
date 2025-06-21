<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Meal extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'ingredients',
        'instructions',
        'calories',
        'protein',
        'carbs',
        'fats',
        'meal_type',
        'diet_type',
    ];

    protected $casts = [
        'ingredients' => 'array',
        'calories' => 'integer',
        'protein' => 'float',
        'carbs' => 'float',
        'fats' => 'float',
    ];

    public function mealPlans(): BelongsToMany
    {
        return $this->belongsToMany(MealPlan::class, 'meal_plan_items')
            ->withPivot('day_of_week', 'meal_type')
            ->withTimestamps();
    }

    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites')
            ->withTimestamps();
    }
} 