<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\StudyNoteController;
use App\Http\Controllers\FlashcardController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\MealPlanController;

// Public routes
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);

    // User Profile routes
    Route::prefix('profile')->group(function () {
        Route::get('/', [UserProfileController::class, 'show']);
        Route::post('/', [UserProfileController::class, 'store']);
        Route::put('/', [UserProfileController::class, 'update']);
        Route::delete('/', [UserProfileController::class, 'destroy']);
    });

    // Meal Plan generation route
    Route::post('meal-plan/generate', [MealPlanController::class, 'generate']);
    Route::get('meal-plan/current', [MealPlanController::class, 'getCurrent']);
}); 