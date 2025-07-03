"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Calendar, Utensils, CheckCircle, AlertCircle } from "lucide-react"
import { mealPlanService } from "@/utils/meal-plan-service"
import { useToast } from "@/components/ui/toast"
import { AuthGuard } from "@/components/auth-guard"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Helper to get today's date string (YYYY-MM-DD)
function getToday() {
  return new Date().toISOString().slice(0, 10)
}

type EatenMealsMap = { [planDayKey: string]: number[] }
function getPlanDayKey(weekStart: string, dayOfWeek: number) {
  return `${weekStart.slice(0, 10)}-${dayOfWeek}`
}
function getEatenMeals(planDayKey: string): number[] {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem("eaten_meals")
  if (!data) return []
  try {
    const parsed: EatenMealsMap = JSON.parse(data)
    return parsed[planDayKey] || []
  } catch {
    return []
  }
}
function setEatenMeals(planDayKey: string, mealIds: number[]) {
  if (typeof window === "undefined") return
  const data = localStorage.getItem("eaten_meals")
  let parsed: EatenMealsMap = {}
  try {
    parsed = data ? JSON.parse(data) : {}
  } catch {
    parsed = {}
  }
  parsed[planDayKey] = mealIds
  localStorage.setItem("eaten_meals", JSON.stringify(parsed))
}

export default function ViewCurrentPlanPage() {
  const [plan, setPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMeal, setSelectedMeal] = useState<any>(null)
  const [eatenMealsMap, setEatenMealsMap] = useState<EatenMealsMap>({})
  const { showErrorToast } = useToast()
  const router = useRouter()

  // Load plan and all eaten meals for the week
  useEffect(() => {
    async function fetchPlan() {
      setIsLoading(true)
      try {
        const plan = await mealPlanService.getCurrentMealPlan()
        setPlan(plan)
        // Load all eaten meals for this week
        if (plan && plan.week_start_date) {
          const data = localStorage.getItem("eaten_meals")
          let parsed: EatenMealsMap = {}
          try {
            parsed = data ? JSON.parse(data) : {}
          } catch {
            parsed = {}
          }
          setEatenMealsMap(parsed)
        }
      } catch (error) {
        showErrorToast("Failed to load meal plan", "Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchPlan()
  }, [])

  // Handler to toggle eaten state for a plan day
  function toggleEaten(weekStart: string, dayOfWeek: number, mealId: number) {
    const planDayKey = getPlanDayKey(weekStart, dayOfWeek)
    const current = eatenMealsMap[planDayKey] || []
    let updated: number[]
    if (current.includes(mealId)) {
      updated = current.filter(id => id !== mealId)
    } else {
      updated = [...current, mealId]
    }
    setEatenMeals(planDayKey, updated)
    setEatenMealsMap({ ...eatenMealsMap, [planDayKey]: updated })
  }

  // Group meals by day_of_week (1=Monday, 7=Sunday)
  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]
  const mealsByDay: Record<number, any[]> = {}
  if (plan && plan.meals) {
    for (const meal of plan.meals) {
      const day = meal.pivot.day_of_week
      if (!mealsByDay[day]) mealsByDay[day] = []
      mealsByDay[day].push(meal)
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 flex flex-col items-center justify-start p-4">
        <div className="sticky top-0 left-0 w-full z-20 flex justify-start bg-gradient-to-br from-orange-900 via-red-900 to-pink-900/90 backdrop-blur-md py-2 mb-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="ml-2 px-4 py-2 rounded-md bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow hover:from-orange-600 hover:to-red-600 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
        <Card className="w-full max-w-4xl backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-400" />
              Active Meal Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              </div>
            ) : plan && plan.meals && plan.meals.length > 0 ? (
              <div className="space-y-6">
                <div className="text-gray-300 mb-4">
                  <span className="font-semibold text-orange-400">
                    Week of {plan.week_start_date ? new Date(plan.week_start_date).toLocaleDateString() : "-"}
                  </span>
                </div>
                {daysOfWeek.map((dayName, idx) => {
                  const planDayKey = plan && plan.week_start_date ? getPlanDayKey(plan.week_start_date, idx + 1) : ''
                  const eatenMeals = getEatenMeals(planDayKey)
                  return (
                    <Card key={dayName} className="bg-white/5 border-white/10 mb-4">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Utensils className="w-4 h-4 text-orange-400" />
                          {dayName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {mealsByDay[idx + 1] && mealsByDay[idx + 1].length > 0 ? (
                          <ul className="space-y-2">
                            {mealsByDay[idx + 1].map((meal: any, i: number) => {
                              const isEaten = eatenMeals.includes(meal.id)
                              return (
                                <li
                                  key={meal.id}
                                  className={`flex items-center gap-3 text-white rounded p-2 transition ${isEaten ? 'bg-green-900/40' : 'hover:bg-orange-900/30'} relative`}
                                >
                                  {/* Eaten checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={isEaten}
                                    onChange={() => plan && plan.week_start_date && toggleEaten(plan.week_start_date, idx + 1, meal.id)}
                                    className="accent-orange-500 w-5 h-5 mr-2 cursor-pointer"
                                    title={isEaten ? 'Mark as not eaten' : 'Mark as eaten'}
                                  />
                                  <CheckCircle className={`w-4 h-4 ${isEaten ? 'text-green-400' : 'text-gray-400'}`} />
                                  <span className="font-semibold cursor-pointer" onClick={() => setSelectedMeal(meal)}>{meal.title}</span>
                                  <span className="ml-auto text-orange-300">{meal.calories} kcal</span>
                                  <span className="ml-2 text-xs text-gray-400 capitalize">{meal.meal_type}</span>
                                  {isEaten && <span className="ml-2 text-green-400 text-xs font-semibold">Eaten</span>}
                                </li>
                              )
                            })}
                          </ul>
                        ) : (
                          <div className="text-gray-400 italic">No meals for this day</div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <AlertCircle className="w-8 h-8 text-orange-400 mb-2" />
                <p className="text-white text-lg font-semibold mb-2">No active meal plan found</p>
                <p className="text-gray-300 mb-4">Generate a new plan to get started!</p>
                <Button onClick={() => router.push("/dashboard")} className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meal Details Dialog */}
        <Dialog open={!!selectedMeal} onOpenChange={open => !open && setSelectedMeal(null)}>
          <DialogContent className="max-w-lg bg-neutral-900/95 border border-white/10">
            {/* Custom close button color */}
            <style>{`
              .meal-dialog-x-btn {
                color: #fb923c !important; /* Tailwind orange-400 */
                transition: color 0.2s;
              }
              .meal-dialog-x-btn:hover {
                color: #f87171 !important; /* Tailwind red-400 */
              }
            `}</style>
            {selectedMeal && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl text-orange-500 mb-2">{selectedMeal.title}</DialogTitle>
                  <DialogDescription className="text-gray-300 mb-2">{selectedMeal.description}</DialogDescription>
                </DialogHeader>
                <div className="mb-2">
                  <span className="font-semibold text-orange-400">Type:</span> {" "}
                  <span
                    className={
                      `capitalize font-semibold ` +
                      (selectedMeal.meal_type === 'breakfast' ? 'text-orange-400' :
                       selectedMeal.meal_type === 'lunch' ? 'text-green-400' :
                       selectedMeal.meal_type === 'dinner' ? 'text-blue-400' :
                       selectedMeal.meal_type === 'snack' ? 'text-purple-400' :
                       'text-gray-300')
                    }
                  >
                    {selectedMeal.meal_type}
                  </span>
                </div>
                <div className="mb-2 flex gap-4 text-sm">
                  <span className="text-orange-300">{selectedMeal.calories} kcal</span>
                  <span className="text-green-300">Protein: {selectedMeal.protein}g</span>
                  <span className="text-pink-300">Carbs: {selectedMeal.carbs}g</span>
                  <span className="text-yellow-300">Fats: {selectedMeal.fats}g</span>
                </div>
                <div className="mb-2">
                  <span className="font-semibold text-orange-400">Ingredients:</span>
                  <ul className="list-disc list-inside text-white mt-1">
                    {selectedMeal.ingredients.map((ing: string, idx: number) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                </div>
                <div className="mb-2">
                  <span className="font-semibold text-orange-400">Instructions:</span>
                  <p className="text-white mt-1 whitespace-pre-line">{selectedMeal.instructions}</p>
                </div>
              </>
            )}
            {/* Patch the X button color */}
            <script dangerouslySetInnerHTML={{__html: `
              setTimeout(() => {
                const closeBtn = document.querySelector('[data-state="open"] button[aria-label="Close"]');
                if (closeBtn) closeBtn.classList.add('meal-dialog-x-btn');
              }, 10);
            `}} />
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
} 