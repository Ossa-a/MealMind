<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiMealService
{
    /**
     * Generate meals for a week using Gemini AI based on user profile/calorie target.
     * @param array $profile
     * @param int $days
     * @return array
     */
    public function generateMeals(array $profile, int $days = 7): array
    {
        try {
            // Build a prompt for Gemini
            $prompt = $this->buildPrompt($profile, $days);
            
            Log::info('Sending request to Gemini AI', [
                'profile_summary' => [
                    'diet_type' => $profile['diet_type'] ?? 'any',
                    'daily_calories' => $profile['daily_calories_target'] ?? 2000,
                    'allergies' => $profile['allergies'] ?? [],
                    'goals' => $profile['goals'] ?? 'maintain_weight'
                ],
                'days' => $days,
                'prompt_length' => strlen($prompt)
            ]);

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->timeout(120)->post(
                config('services.gemini.endpoint') . '?key=' . config('services.gemini.api_key'),
                [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ]
                ]
            );

            Log::info('Received response from Gemini AI', [
                'status_code' => $response->status(),
                'response_size' => strlen($response->body()),
                'headers' => $response->headers()
            ]);

            if (!$response->successful()) {
                Log::error('Gemini API request failed', [
                    'status_code' => $response->status(),
                    'response_body' => $response->body(),
                    'error' => 'HTTP ' . $response->status()
                ]);
                throw new \Exception('Gemini API request failed: ' . $response->status());
            }

            $responseData = $response->json();
            Log::info('Parsed Gemini response data', [
                'response_structure' => array_keys($responseData),
                'has_candidates' => isset($responseData['candidates']),
                'candidates_count' => count($responseData['candidates'] ?? [])
            ]);

            // Parse Gemini response (assume JSON array of meals)
            $meals = $this->parseGeminiResponse($responseData);
            
            Log::info('Successfully parsed meals from Gemini response', [
                'meals_count' => count($meals),
                'meals_summary' => array_map(function($meal) {
                    return [
                        'title' => $meal['title'] ?? 'Unknown',
                        'meal_type' => $meal['meal_type'] ?? 'Unknown',
                        'day_of_week' => $meal['day_of_week'] ?? 'Unknown',
                        'calories' => $meal['calories'] ?? 0
                    ];
                }, $meals)
            ]);

            return $meals;

        } catch (\Exception $e) {
            Log::error('Failed to generate meals with Gemini AI', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'profile' => array_diff_key($profile, array_flip(['created_at', 'updated_at']))
            ]);
            throw $e;
        }
    }

    private function buildPrompt(array $profile, int $days): string
    {
        $diet = $profile['diet_type'] ?? 'any';
        $calories = $profile['daily_calories_target'] ?? 2000;
        $allergies = isset($profile['allergies']) && is_array($profile['allergies']) ? implode(', ', $profile['allergies']) : 'none';
        
        $prompt = "Generate a {$days}-day meal plan. Each day should have breakfast, lunch, dinner, and snack. Each meal should include: title, description, ingredients (as array), instructions, calories, protein, carbs, fats, meal_type, and diet_type. Total daily calories should be close to {$calories}. Diet: {$diet}. Allergies: {$allergies}. Respond in JSON array format.";
        
        Log::debug('Built Gemini prompt', [
            'prompt' => $prompt,
            'profile_data' => [
                'diet_type' => $diet,
                'calories' => $calories,
                'allergies' => $allergies
            ]
        ]);
        
        return $prompt;
    }

    private function parseGeminiResponse($response): array
    {
        try {
            $json = $response['candidates'][0]['content']['parts'][0]['text'] ?? '[]';

            // Remove Markdown code block if present
            $json = preg_replace('/^```json\\s*|```$/i', '', trim($json));

            Log::debug('Raw JSON from Gemini response', [
                'json_length' => strlen($json),
                'json_preview' => substr($json, 0, 500) . '...'
            ]);

            $parsed = json_decode($json, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('Failed to parse JSON from Gemini response', [
                    'json_error' => json_last_error_msg(),
                    'raw_json' => $json
                ]);
                throw new \Exception('Invalid JSON response from Gemini: ' . json_last_error_msg());
            }

            // Flatten the structure: for each day, add day_of_week to each meal
            $meals = [];
            foreach ($parsed as $dayBlock) {
                $day = $dayBlock['day'] ?? null;
                // Convert "Day 1" to 1, "Day 2" to 2, etc.
                if (is_string($day) && preg_match('/Day\\s*(\\d+)/i', $day, $matches)) {
                    $day = (int)$matches[1];
                }
                foreach ($dayBlock['meals'] ?? [] as $meal) {
                    $meal['day_of_week'] = $day;
                    $meals[] = $meal;
                }
            }

            Log::info('Successfully parsed meals from JSON', [
                'meals_count' => count($meals),
                'first_meal_keys' => count($meals) > 0 ? array_keys($meals[0]) : []
            ]);

            return $meals;

        } catch (\Exception $e) {
            Log::error('Failed to parse Gemini response', [
                'error' => $e->getMessage(),
                'response_structure' => array_keys($response),
                'response_preview' => json_encode(array_slice($response, 0, 2))
            ]);
            throw $e;
        }
    }
} 