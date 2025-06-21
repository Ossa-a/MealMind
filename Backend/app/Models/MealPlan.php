<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MealPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'week_start_date',
        'status',
    ];

    protected $casts = [
        'week_start_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function meals(): BelongsToMany
    {
        return $this->belongsToMany(Meal::class, 'meal_plan_items')
            ->withPivot('day_of_week', 'meal_type')
            ->withTimestamps();
    }

    public function getMealsForDay(int $dayOfWeek)
    {
        return $this->meals()
            ->wherePivot('day_of_week', $dayOfWeek)
            ->orderByPivot('meal_type')
            ->get();
    }
} 