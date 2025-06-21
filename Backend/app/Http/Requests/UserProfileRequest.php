<?php

namespace App\Http\Requests;

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
            'goals' => 'nullable|string|max:1000',
            'diet_type' => 'nullable|string|max:50',
            'allergies' => 'nullable|array',
            'allergies.*' => 'string|max:50',
            'daily_calories_target' => 'nullable|integer|min:500|max:10000',
            'weight' => 'nullable|numeric|min:20|max:500',
            'height' => 'nullable|numeric|min:50|max:300',
            'activity_level' => 'nullable|in:sedentary,light,moderate,very_active',
            'gender' => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date|before:today|after:1900-01-01',
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
            'daily_calories_target.min' => 'The daily calorie target must be at least 500 calories.',
            'daily_calories_target.max' => 'The daily calorie target cannot exceed 10,000 calories.',
            'weight.min' => 'The weight must be at least 20 kg.',
            'weight.max' => 'The weight cannot exceed 500 kg.',
            'height.min' => 'The height must be at least 50 cm.',
            'height.max' => 'The height cannot exceed 300 cm.',
            'date_of_birth.before' => 'The date of birth must be in the past.',
            'date_of_birth.after' => 'The date of birth must be after 1900.',
        ];
    }
}
