# User Profile Examples

This document provides example profiles for different types of users and explains how the calorie calculation works for each case.

## Available Options

### Activity Levels
- `sedentary`: Little to no exercise, desk job (multiplier: 1.2)
- `light`: Light exercise 1-3 times/week (multiplier: 1.375)
- `moderate`: Moderate exercise 3-5 times/week (multiplier: 1.55)
- `very active`: Heavy exercise 6-7 times/week (multiplier: 1.725)
- `extra active`: Very heavy exercise, physical job or training 2x/day (multiplier: 1.9)

### Diet Types
- `keto`: High fat, very low carb (affects calculation: -5% calories)
- `vegetarian`: Plant-based with dairy/eggs
- `vegan`: Strictly plant-based
- `paleo`: Based on whole foods
- `mediterranean`: Based on Mediterranean diet
- Any other specific diet type (string, max 50 chars)

### Goals
Common goal combinations and their effects on calorie calculation:
- Weight loss: Applies deficit based on BMI
- Muscle gain: Applies surplus based on BMI
- Weight loss + Muscle gain: Reduced deficit to support muscle growth
- Maintenance: No adjustment
- Weight gain: Applies surplus based on BMI

## Example Profiles

### 1. Weight Loss Focus - Overweight Individual
```json
{
    "goals": "Lose weight and improve overall health",
    "diet_type": "mediterranean",
    "weight": 95,
    "height": 175,
    "activity_level": "light",
    "gender": "male",
    "date_of_birth": "1985-06-15",
    "allergies": ["nuts"]
}
```
BMI: 31 (Obese) → 20% deficit
Expected calories: ~2000-2200 (higher deficit due to BMI)

### 2. Muscle Building - Athletic Individual
```json
{
    "goals": "Build muscle and increase strength",
    "diet_type": "high-protein",
    "weight": 70,
    "height": 178,
    "activity_level": "very active",
    "gender": "male",
    "date_of_birth": "1995-03-22",
    "allergies": []
}
```
BMI: 22.1 (Normal) → 10% surplus
Expected calories: ~3000-3200 (high due to activity level and surplus)

### 3. Weight Loss + Muscle Building
```json
{
    "goals": "Lose weight and build muscle",
    "diet_type": "keto",
    "weight": 75.5,
    "height": 180,
    "activity_level": "moderate",
    "gender": "male",
    "date_of_birth": "1990-01-01",
    "allergies": ["peanuts", "shellfish"]
}
```
BMI: 23.3 (Normal) → 7.5% deficit (reduced due to muscle goal)
Expected calories: ~2450-2500 (moderate deficit + keto adjustment)

### 4. Female Weight Loss
```json
{
    "goals": "Lose weight gradually and maintain muscle",
    "diet_type": "mediterranean",
    "weight": 68,
    "height": 165,
    "activity_level": "moderate",
    "gender": "female",
    "date_of_birth": "1992-08-10",
    "allergies": ["dairy"]
}
```
BMI: 25 (Slightly Overweight) → 15% deficit
Expected calories: ~1800-1900

### 5. Senior Maintenance
```json
{
    "goals": "Maintain weight and stay active",
    "diet_type": "mediterranean",
    "weight": 65,
    "height": 170,
    "activity_level": "light",
    "gender": "male",
    "date_of_birth": "1955-12-25",
    "allergies": []
}
```
BMI: 22.5 (Normal) → No adjustment
Expected calories: ~2000-2100 (lower due to age)

### 6. Athletic Performance
```json
{
    "goals": "Improve athletic performance and maintain muscle mass",
    "diet_type": "high-carb",
    "weight": 65,
    "height": 170,
    "activity_level": "extra active",
    "gender": "female",
    "date_of_birth": "1998-04-30",
    "allergies": []
}
```
BMI: 22.5 (Normal) → 5% surplus
Expected calories: ~2600-2800 (high due to activity level)

### 7. Underweight Gain
```json
{
    "goals": "Gain weight and build strength",
    "diet_type": "high-protein",
    "weight": 55,
    "height": 175,
    "activity_level": "moderate",
    "gender": "male",
    "date_of_birth": "2000-01-15",
    "allergies": []
}
```
BMI: 18 (Underweight) → 10% surplus
Expected calories: ~2800-3000

## Notes on Calculation Factors

1. **BMI-Based Adjustments**
   - BMI > 30: 20% deficit for weight loss
   - BMI 25-30: 15% deficit for weight loss
   - BMI 18.5-25: 10% deficit for weight loss
   - BMI < 18.5: 10% surplus recommended

2. **Activity Level Impact**
   - Sedentary: BMR × 1.2
   - Light: BMR × 1.375
   - Moderate: BMR × 1.55
   - Very Active: BMR × 1.725
   - Extra Active: BMR × 1.9

3. **Diet Type Adjustments**
   - Keto: -5% total calories
   - Other diets: no direct calorie adjustment

4. **Goal Combinations**
   - Weight Loss + Muscle: Deficit reduced by 25%
   - Pure Weight Loss: Full deficit applied
   - Pure Muscle Gain: Full surplus applied

5. **Safety Limits**
   - Minimum calories (male): 1500
   - Minimum calories (female): 1200
   - Maximum calories: 10000 