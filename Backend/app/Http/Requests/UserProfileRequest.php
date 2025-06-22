<?php

namespace App\Http\Requests;

use App\Models\UserProfile;
use Illuminate\Foundation\Http\FormRequest;

class UserProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization will be handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'goals' => 'required|string|max:1000',
            'diet_type' => 'nullable|string|max:50',
            'allergies' => 'nullable|array',
            'allergies.*' => 'string|max:50',
            'daily_calories_target' => 'nullable|integer|min:500|max:10000',
            'weight' => 'required|numeric|min:20|max:500',
            'height' => 'required|numeric|min:50|max:300',
            'activity_level' => 'required|in:' . implode(',', UserProfile::getActivityLevels()),
            'gender' => 'required|in:' . implode(',', UserProfile::getGenders()),
            'date_of_birth' => 'required|date|before:today|after:1900-01-01',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'goals.required' => 'Please specify your fitness and dietary goals.',
            'weight.required' => 'Weight is required for calorie calculation.',
            'weight.min' => 'The weight must be at least 20 kg.',
            'weight.max' => 'The weight cannot exceed 500 kg.',
            'height.required' => 'Height is required for calorie calculation.',
            'height.min' => 'The height must be at least 50 cm.',
            'height.max' => 'The height cannot exceed 300 cm.',
            'activity_level.required' => 'Activity level is required for calorie calculation.',
            'activity_level.in' => 'Activity level must be one of: ' . implode(', ', UserProfile::getActivityLevels()),
            'gender.required' => 'Gender is required for calorie calculation.',
            'gender.in' => 'Gender must be one of: ' . implode(', ', UserProfile::getGenders()),
            'date_of_birth.required' => 'Date of birth is required for calorie calculation.',
            'date_of_birth.before' => 'The date of birth must be in the past.',
            'date_of_birth.after' => 'The date of birth must be after 1900.',
        ];
    }
}
