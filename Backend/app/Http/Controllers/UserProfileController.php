<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserProfileRequest;
use App\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class UserProfileController extends Controller
{
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

        $profile = new UserProfile($request->validated());
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

        $profile->update($request->validated());

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
