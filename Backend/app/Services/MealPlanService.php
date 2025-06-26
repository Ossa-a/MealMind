<?php

namespace App\Services;

use App\Models\Meal;
use App\Models\MealPlan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MealPlanService
{
    /**
     * Create a weekly meal plan for a user, given meals (array of arrays with day_of_week and meal_type).
     * @param \App\Models\User $user
     * @param array $meals
     * @param string $weekStartDate
     * @return MealPlan
     */
    public function createWeeklyPlan($user, array $meals, $weekStartDate = null): MealPlan
    {
        Log::info('Starting meal plan creation', [
            'user_id' => $user->id,
            'meals_count' => count($meals),
            'week_start_date' => $weekStartDate ?? now()->startOfWeek()->toDateString(),
            'meals_summary' => $this->getMealsSummary($meals)
        ]);

        return DB::transaction(function () use ($user, $meals, $weekStartDate) {
            try {
                $plan = MealPlan::create([
                    'user_id' => $user->id,
                    'week_start_date' => $weekStartDate ?? now()->startOfWeek()->toDateString(),
                    'status' => 'active',
                ]);

                Log::info('Created meal plan', [
                    'plan_id' => $plan->id,
                    'user_id' => $plan->user_id,
                    'week_start_date' => $plan->week_start_date,
                    'status' => $plan->status
                ]);

                $createdMeals = [];
                $totalCalories = 0;

                foreach ($meals as $index => $mealData) {
                    try {
                        Log::debug('Creating meal', [
                            'meal_index' => $index,
                            'meal_title' => $mealData['title'] ?? 'Unknown',
                            'meal_type' => $mealData['meal_type'] ?? 'Unknown',
                            'day_of_week' => $mealData['day_of_week'] ?? 'Unknown'
                        ]);

                        // Save meal if not exists (or you may want to always create new)
                        $meal = Meal::create([
                            'title' => $mealData['title'],
                            'description' => $mealData['description'],
                            'ingredients' => $mealData['ingredients'],
                            'instructions' => $mealData['instructions'],
                            'calories' => $mealData['calories'],
                            'protein' => $mealData['protein'],
                            'carbs' => $mealData['carbs'],
                            'fats' => $mealData['fats'],
                            'meal_type' => $mealData['meal_type'],
                            'diet_type' => $mealData['diet_type'],
                        ]);

                        // Attach to plan with pivot data
                        $plan->meals()->attach($meal->id, [
                            'day_of_week' => $mealData['day_of_week'],
                            'meal_type' => $mealData['meal_type'],
                        ]);

                        $createdMeals[] = [
                            'id' => $meal->id,
                            'title' => $meal->title,
                            'meal_type' => $meal->meal_type,
                            'day_of_week' => $mealData['day_of_week'],
                            'calories' => $meal->calories
                        ];

                        $totalCalories += $meal->calories;

                        Log::debug('Successfully created and attached meal', [
                            'meal_id' => $meal->id,
                            'plan_id' => $plan->id,
                            'day_of_week' => $mealData['day_of_week'],
                            'meal_type' => $mealData['meal_type']
                        ]);

                    } catch (\Exception $e) {
                        Log::error('Failed to create meal', [
                            'meal_index' => $index,
                            'meal_data' => $mealData,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                        throw $e;
                    }
                }

                Log::info('Successfully created meal plan with all meals', [
                    'plan_id' => $plan->id,
                    'total_meals' => count($createdMeals),
                    'total_calories' => $totalCalories,
                    'average_calories_per_meal' => count($createdMeals) > 0 ? round($totalCalories / count($createdMeals)) : 0,
                    'meals_by_type' => $this->groupMealsByType($createdMeals),
                    'meals_by_day' => $this->groupMealsByDay($createdMeals)
                ]);

                $planWithMeals = $plan->load('meals');
                
                Log::info('Loaded meal plan with relationships', [
                    'plan_id' => $planWithMeals->id,
                    'loaded_meals_count' => $planWithMeals->meals->count(),
                    'plan_relationships' => array_keys($planWithMeals->getRelations())
                ]);

                return $planWithMeals;

            } catch (\Exception $e) {
                Log::error('Failed to create meal plan in transaction', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e;
            }
        });
    }

    /**
     * Get a summary of meals for logging
     */
    private function getMealsSummary(array $meals): array
    {
        $summary = [
            'total_count' => count($meals),
            'by_meal_type' => [],
            'by_day' => [],
            'calorie_ranges' => [
                'min' => PHP_INT_MAX,
                'max' => 0,
                'total' => 0
            ]
        ];

        foreach ($meals as $meal) {
            $mealType = $meal['meal_type'] ?? 'unknown';
            $dayOfWeek = $meal['day_of_week'] ?? 'unknown';
            $calories = $meal['calories'] ?? 0;

            $summary['by_meal_type'][$mealType] = ($summary['by_meal_type'][$mealType] ?? 0) + 1;
            $summary['by_day'][$dayOfWeek] = ($summary['by_day'][$dayOfWeek] ?? 0) + 1;
            
            $summary['calorie_ranges']['min'] = min($summary['calorie_ranges']['min'], $calories);
            $summary['calorie_ranges']['max'] = max($summary['calorie_ranges']['max'], $calories);
            $summary['calorie_ranges']['total'] += $calories;
        }

        $summary['calorie_ranges']['average'] = count($meals) > 0 ? round($summary['calorie_ranges']['total'] / count($meals)) : 0;

        return $summary;
    }

    /**
     * Group meals by type for logging
     */
    private function groupMealsByType(array $meals): array
    {
        $grouped = [];
        foreach ($meals as $meal) {
            $type = $meal['meal_type'] ?? 'unknown';
            if (!isset($grouped[$type])) {
                $grouped[$type] = 0;
            }
            $grouped[$type]++;
        }
        return $grouped;
    }

    /**
     * Group meals by day for logging
     */
    private function groupMealsByDay(array $meals): array
    {
        $grouped = [];
        foreach ($meals as $meal) {
            $day = $meal['day_of_week'] ?? 'unknown';
            if (!isset($grouped[$day])) {
                $grouped[$day] = 0;
            }
            $grouped[$day]++;
        }
        return $grouped;
    }
} 