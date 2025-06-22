<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserProfileRequest;
use App\Models\UserProfile;
use App\Services\AiCalorieService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class UserProfileController extends Controller
{
    protected AiCalorieService $aiCalorieService;

    public function __construct(AiCalorieService $aiCalorieService)
    {
        $this->aiCalorieService = $aiCalorieService;
    }

    /**
     * Get the authenticated user's profile.
     */
    public function show(): JsonResponse
    {
        $profile = auth()->user()->profile;

        if (!$profile) {
            return response()->json([
                'message' => 'Profile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json($profile);
    }

    /**
     * Create or update the authenticated user's profile.
     */
    public function store(UserProfileRequest $request): JsonResponse
    {
        $user = auth()->user();
        $profile = $user->profile;

        if ($profile) {
            return response()->json([
                'message' => 'Profile already exists. Use PUT method to update.'
            ], Response::HTTP_CONFLICT);
        }

        $profileData = $request->validated();
        
        // Calculate daily calories if not provided
        if (!isset($profileData['daily_calories_target'])) {
            Log::info('Calculating daily calories for new profile');
            $calories = $this->aiCalorieService->calculateDailyCalories($profileData);
            
            if ($calories === null) {
                return response()->json([
                    'message' => 'Failed to calculate daily calorie target'
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            Log::info('Calorie calculation successful', ['calories' => $calories]);
            $profileData['daily_calories_target'] = $calories;
        }

        $profile = new UserProfile($profileData);
        $user->profile()->save($profile);

        return response()->json([
            'message' => 'Profile created successfully',
            'profile' => $profile
        ], Response::HTTP_CREATED);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function update(UserProfileRequest $request): JsonResponse
    {
        $user = auth()->user();
        $profile = $user->profile;

        if (!$profile) {
            return response()->json([
                'message' => 'Profile not found. Use POST method to create.'
            ], Response::HTTP_NOT_FOUND);
        }

        $profileData = $request->validated();

        // Recalculate daily calories if relevant fields are updated
        $relevantFieldsUpdated = array_intersect_key($profileData, array_flip([
            'weight', 'height', 'activity_level', 'gender', 'date_of_birth', 'goals'
        ]));

        if (!empty($relevantFieldsUpdated) && !isset($profileData['daily_calories_target'])) {
            Log::info('Recalculating daily calories due to profile updates', [
                'updated_fields' => array_keys($relevantFieldsUpdated)
            ]);

            // Merge existing data with updates for calculation
            $calculationData = array_merge($profile->toArray(), $profileData);
            $calories = $this->aiCalorieService->calculateDailyCalories($calculationData);
            
            if ($calories === null) {
                return response()->json([
                    'message' => 'Failed to recalculate daily calorie target'
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            Log::info('Calorie recalculation successful', ['calories' => $calories]);
            $profileData['daily_calories_target'] = $calories;
        }

        $profile->update($profileData);

        return response()->json([
            'message' => 'Profile updated successfully',
            'profile' => $profile
        ]);
    }

    /**
     * Delete the authenticated user's profile.
     */
    public function destroy(): JsonResponse
    {
        $user = auth()->user();
        $profile = $user->profile;

        if (!$profile) {
            return response()->json([
                'message' => 'Profile not found'
            ], Response::HTTP_NOT_FOUND);
        }

        $profile->delete();

        return response()->json([
            'message' => 'Profile deleted successfully'
        ]);
    }
}
