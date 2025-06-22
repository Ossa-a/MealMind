<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    use HasFactory;

    /**
     * Activity level constants
     */
    public const ACTIVITY_SEDENTARY = 'sedentary';
    public const ACTIVITY_LIGHT = 'light';
    public const ACTIVITY_MODERATE = 'moderate';
    public const ACTIVITY_VERY_ACTIVE = 'very active';
    public const ACTIVITY_EXTRA_ACTIVE = 'extra active';

    /**
     * Gender constants
     */
    public const GENDER_MALE = 'male';
    public const GENDER_FEMALE = 'female';
    public const GENDER_OTHER = 'other';

    /**
     * Get the list of valid activity levels
     */
    public static function getActivityLevels(): array
    {
        return [
            self::ACTIVITY_SEDENTARY,
            self::ACTIVITY_LIGHT,
            self::ACTIVITY_MODERATE,
            self::ACTIVITY_VERY_ACTIVE,
            self::ACTIVITY_EXTRA_ACTIVE,
        ];
    }

    /**
     * Get the list of valid genders
     */
    public static function getGenders(): array
    {
        return [
            self::GENDER_MALE,
            self::GENDER_FEMALE,
            self::GENDER_OTHER,
        ];
    }

    /**
     * Get activity level multiplier for calorie calculation
     */
    public function getActivityMultiplier(): float
    {
        return match($this->activity_level) {
            self::ACTIVITY_SEDENTARY => 1.2,
            self::ACTIVITY_LIGHT => 1.375,
            self::ACTIVITY_MODERATE => 1.55,
            self::ACTIVITY_VERY_ACTIVE => 1.725,
            self::ACTIVITY_EXTRA_ACTIVE => 1.9,
            default => 1.55, // Default to moderate
        };
    }

    protected $fillable = [
        'user_id',
        'goals',
        'diet_type',
        'allergies',
        'daily_calories_target',
        'weight',
        'height',
        'activity_level',
        'gender',
        'date_of_birth',
    ];

    protected $casts = [
        'allergies' => 'array',
        'date_of_birth' => 'date',
        'weight' => 'float',
        'height' => 'float',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
} 