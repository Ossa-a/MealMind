<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    use HasFactory;

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