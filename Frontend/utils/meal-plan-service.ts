import { apiClient } from "./api-client"

interface MealPlanResponse {
  success: boolean
  data: {
    meal_plan: any // The AI-generated meal plan structure
    generated_at: string
  }
  message: string
}

class MealPlanService {
  async generateMealPlan(): Promise<any> {
    const response: MealPlanResponse = await apiClient.request("/api/meal-plan/generate", {
      method: "POST",
      body: JSON.stringify({}),
    })

    return response.data
  }

  async getCurrentMealPlan(): Promise<any> {
    const response = await apiClient.request("/api/meal-plan/current", {
      method: "GET",
    })
    return response.plan
  }
}

export const mealPlanService = new MealPlanService()
export type { MealPlanResponse }
