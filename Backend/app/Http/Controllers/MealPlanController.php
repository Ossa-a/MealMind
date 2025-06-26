<?php

namespace App\Http\Controllers;

use App\Services\GeminiMealService;
use App\Services\MealPlanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class MealPlanController extends Controller
{
    protected GeminiMealService $geminiMealService;
    protected MealPlanService $mealPlanService;

    public function __construct(GeminiMealService $geminiMealService, MealPlanService $mealPlanService)
    {
        $this->geminiMealService = $geminiMealService;
        $this->mealPlanService = $mealPlanService;
    }

    /**
     * Generate a meal plan for the authenticated user using Gemini AI
     */
    public function generate(Request $request): JsonResponse
    {
        set_time_limit(180); // Allow up to 3 minutes for this request
        $user = $request->user();
        $profile = $user->profile;
        if (!$profile) {
            return response()->json(['message' => 'User profile not found'], 404);
        }
        try {
            $meals = $this->geminiMealService->generateMeals($profile->toArray());
            // Expecting each meal to have 'day_of_week' and 'meal_type'
            $plan = $this->mealPlanService->createWeeklyPlan($user, $meals);
            return response()->json([
                'message' => 'Meal plan generated successfully',
                'plan' => $plan
            ]);
        } catch (\Exception $e) {
            Log::error('Meal plan generation failed: ' . $e->getMessage(), [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to generate meal plan'], 500);
        }
    }
} 