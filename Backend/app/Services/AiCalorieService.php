<?php

namespace App\Services;

use App\Models\UserProfile;
use Illuminate\Support\Facades\Log;

class AiCalorieService
{
    /**
     * Calculate daily calorie target based on user profile data using the Harris-Benedict formula
     */
    public function calculateDailyCalories(array $profileData): ?int
    {
        try {
            Log::info('Starting calorie calculation with profile data:', [
                'profile_data' => array_diff_key($profileData, array_flip(['created_at', 'updated_at']))
            ]);

            // Extract required data
            $gender = $profileData['gender'] ?? null;
            $weight = $profileData['weight'] ?? null;
            $height = $profileData['height'] ?? null;
            $activityLevel = $profileData['activity_level'] ?? UserProfile::ACTIVITY_MODERATE;
            $goals = $profileData['goals'] ?? 'maintain_weight';
            $dateOfBirth = $profileData['date_of_birth'] ?? null;
            $dietType = $profileData['diet_type'] ?? null;

            // Validate required data
            if (!$gender || !$weight || !$height || !$dateOfBirth) {
                throw new \Exception('Missing required profile data for calorie calculation');
            }

            // Calculate age
            $age = date_diff(date_create($dateOfBirth), date_create('now'))->y;

            // Calculate BMI
            $heightInMeters = $height / 100;
            $bmi = $weight / ($heightInMeters * $heightInMeters);
            Log::info('Calculated BMI:', ['bmi' => $bmi]);

            // Calculate BMR using Harris-Benedict formula
            if ($gender === UserProfile::GENDER_MALE) {
                $bmr = 88.362 + (13.397 * $weight) + (4.799 * $height) - (5.677 * $age);
            } else {
                $bmr = 447.593 + (9.247 * $weight) + (3.098 * $height) - (4.330 * $age);
            }
            Log::info('Calculated BMR:', ['bmr' => $bmr]);

            // Create a temporary UserProfile instance to get the activity multiplier
            $profile = new UserProfile(['activity_level' => $activityLevel]);
            $calories = $bmr * $profile->getActivityMultiplier();
            Log::info('Applied activity multiplier:', ['tdee' => $calories]);

            // Determine goal adjustment using enum values
            $hasWeightLossGoal = $goals === 'lose_weight';
            $hasMuscleGoal = $goals === 'gain_muscle';
            $hasWeightGainGoal = false; // No separate gain_weight enum, only gain_muscle

            // Adjust based on goals and BMI
            if ($hasWeightLossGoal) {
                // Higher deficit for higher BMI
                if ($bmi > 30) {
                    $deficit = 0.20; // 20% deficit for obese
                } elseif ($bmi > 25) {
                    $deficit = 0.15; // 15% deficit for overweight
                } else {
                    $deficit = 0.10; // 10% deficit for normal weight
                }
                $calories *= (1 - $deficit);
                Log::info('Applied weight loss adjustment:', ['deficit' => $deficit, 'calories' => $calories]);
            } elseif ($hasMuscleGoal) {
                // Lower surplus for higher BMI
                if ($bmi > 25) {
                    $surplus = 0.05; // 5% surplus for overweight
                } else {
                    $surplus = 0.10; // 10% surplus for normal/underweight
                }
                $calories *= (1 + $surplus);
                Log::info('Applied muscle gain adjustment:', ['surplus' => $surplus, 'calories' => $calories]);
            } // maintain_weight: no adjustment

            // Adjust for diet type
            if ($dietType === 'keto') {
                // Slightly lower calories for keto due to metabolic effects
                $calories *= 0.95;
                Log::info('Applied keto diet adjustment:', ['calories' => $calories]);
            }

            // Ensure minimum healthy calories
            $minCalories = ($gender === UserProfile::GENDER_MALE) ? 1500 : 1200;
            $calories = max($calories, $minCalories);

            // Round to nearest 50 calories
            $calories = round($calories / 50) * 50;

            Log::info('Final calculated calories:', ['calories' => $calories]);
            return (int) $calories;

        } catch (\Exception $e) {
            Log::error('Calorie calculation failed: ' . $e->getMessage(), [
                'profile_data' => $profileData,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }
} 