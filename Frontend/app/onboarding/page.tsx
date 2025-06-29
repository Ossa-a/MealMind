"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/toast"
import { AuthGuard } from "@/components/auth-guard"
import { profileService, type CreateProfileRequest } from "@/utils/profile-service"
import { ValidationError, ApiError } from "@/utils/api-client"
import {
  Target,
  Leaf,
  User,
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Scale,
  Ruler,
  Calendar,
  Loader2,
} from "lucide-react"

const steps = [
  { id: 1, title: "Goals & Objectives", icon: Target },
  { id: 2, title: "Diet Preferences", icon: Leaf },
  { id: 3, title: "Physical Stats", icon: User },
  { id: 4, title: "Activity Level", icon: Activity },
  { id: 5, title: "Allergies & Restrictions", icon: AlertTriangle },
]

const goalOptions = [
  { id: "lose_weight", title: "Lose Weight", description: "Reduce body weight through caloric deficit", icon: "⬇️" },
  { id: "gain_muscle", title: "Gain Muscle", description: "Build lean muscle mass with proper nutrition", icon: "💪" },
  {
    id: "maintain_weight",
    title: "Maintain Weight",
    description: "Keep current weight while improving health",
    icon: "⚖️",
  },
]

const dietOptions = [
  { id: "keto", title: "Keto", description: "High fat, low carb lifestyle", color: "from-purple-500 to-pink-500" },
  { id: "vegan", title: "Vegan", description: "Plant-based nutrition", color: "from-green-500 to-emerald-500" },
  {
    id: "vegetarian",
    title: "Vegetarian",
    description: "Vegetarian with dairy & eggs",
    color: "from-green-400 to-teal-500",
  },
  { id: "paleo", title: "Paleo", description: "Whole foods, no processed", color: "from-orange-500 to-red-500" },
  {
    id: "mediterranean",
    title: "Mediterranean",
    description: "Heart-healthy traditional diet",
    color: "from-blue-500 to-cyan-500",
  },
  { id: "none", title: "No Preference", description: "Flexible eating approach", color: "from-gray-500 to-slate-500" },
]

const activityOptions = [
  { id: "sedentary", title: "Sedentary", description: "Little to no exercise", icon: "🪑", multiplier: "1.2x" },
  {
    id: "light",
    title: "Light Activity",
    description: "Light exercise 1-3 days/week",
    icon: "🚶",
    multiplier: "1.375x",
  },
  {
    id: "moderate",
    title: "Moderate Activity",
    description: "Moderate exercise 3-5 days/week",
    icon: "🏃",
    multiplier: "1.55x",
  },
  {
    id: "very_active",
    title: "Very Active",
    description: "Hard exercise 6-7 days/week",
    icon: "🏋️",
    multiplier: "1.725x",
  },
]

const commonAllergies = ["Peanuts", "Shellfish", "Dairy", "Gluten", "Eggs", "Soy", "Fish", "Tree Nuts"]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [formData, setFormData] = useState({
    goals: "",
    diet_type: "",
    weight: "",
    height: "",
    gender: "",
    date_of_birth: "",
    activity_level: "",
    allergies: [] as string[],
    customAllergy: "",
  })

  const router = useRouter()
  const { showSuccessToast, showErrorToast, showLoadingToast, removeToast } = useToast()
  let loadingToastId: string | undefined

  const progress = (currentStep / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      handleOnboardingSubmit()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleAllergyToggle = (allergy: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }))
  }

  const handleOnboardingSubmit = async () => {
    setIsSubmitting(true)
    setValidationErrors({})

    try {
      loadingToastId = showLoadingToast(
        "Creating your profile...",
        "Our AI is calculating your personalized nutrition plan",
      )

      // Prepare allergies array
      const allergies = [...formData.allergies]
      if (formData.customAllergy.trim()) {
        allergies.push(formData.customAllergy.trim())
      }

      // Transform form data to match API format
      const profileData: CreateProfileRequest = {
        goals: formData.goals as "lose_weight" | "gain_muscle" | "maintain_weight",
        diet_type: formData.diet_type,
        allergies,
        weight: Number.parseFloat(formData.weight),
        height: Number.parseFloat(formData.height),
        activity_level: formData.activity_level as "sedentary" | "light" | "moderate" | "very_active",
        gender: formData.gender as "male" | "female",
        date_of_birth: formData.date_of_birth, // Already in YYYY-MM-DD format
      }

      const profile = await profileService.createProfile(profileData)

      removeToast(loadingToastId)

      // Show success animation
      showSuccessToast(
        "Profile created successfully!",
        `Your daily calorie target: ${profile.daily_calories_target} calories`,
      )

      // Small delay for user to see success message
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      if (loadingToastId) {
        removeToast(loadingToastId)
      }

      if (error instanceof ValidationError) {
        setValidationErrors(error.errors)
        showErrorToast("Please check your information", "Some fields need your attention")

        // Navigate back to step with errors (simplified logic)
        if (error.errors.goals || error.errors.diet_type) {
          setCurrentStep(1)
        } else if (error.errors.weight || error.errors.height || error.errors.gender || error.errors.date_of_birth) {
          setCurrentStep(3)
        } else if (error.errors.activity_level) {
          setCurrentStep(4)
        } else if (error.errors.allergies) {
          setCurrentStep(5)
        }
      } else if (error instanceof ApiError) {
        showErrorToast("Profile creation failed", error.message)
      } else {
        showErrorToast("Something went wrong", "Please try again later")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFieldError = (fieldName: string) => {
    return validationErrors[fieldName]?.[0]
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">What's your main goal?</h2>
              <p className="text-gray-300">Choose your primary objective to personalize your meal plans</p>
            </div>
            <div className="grid gap-4">
              {goalOptions.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      formData.goals === goal.id
                        ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                    onClick={() => setFormData({ ...formData, goals: goal.id })}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{goal.icon}</div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white">{goal.title}</h3>
                          <p className="text-gray-300">{goal.description}</p>
                        </div>
                        {formData.goals === goal.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center"
                          >
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </motion.div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Diet Preferences</h2>
              <p className="text-gray-300">Select your preferred eating style</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {dietOptions.map((diet, index) => (
                <motion.div
                  key={diet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      formData.diet_type === diet.id
                        ? `bg-gradient-to-r ${diet.color} bg-opacity-20 border-orange-500`
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                    onClick={() => setFormData({ ...formData, diet_type: diet.id })}
                  >
                    <CardContent className="p-6">
                      <div className="text-center">
                        <h3 className="text-xl font-semibold text-white mb-2">{diet.title}</h3>
                        <p className="text-gray-300 text-sm">{diet.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )

      case 3:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Physical Stats</h2>
              <p className="text-gray-300">Help us calculate your nutritional needs</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Weight (kg)
                </Label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="70"
                />
                {getFieldError("weight") && <p className="text-red-500 text-sm">{getFieldError("weight")}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  Height (cm)
                </Label>
                <Input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="175"
                />
                {getFieldError("height") && <p className="text-red-500 text-sm">{getFieldError("height")}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Gender
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {["male", "female"].map((gender) => (
                    <Button
                      key={gender}
                      type="button"
                      variant={formData.gender === gender ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, gender })}
                      className={
                        formData.gender === gender
                          ? "bg-gradient-to-r from-orange-500 to-red-500"
                          : "border-white/20 text-white hover:bg-white/10"
                      }
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Button>
                  ))}
                </div>
                {getFieldError("gender") && <p className="text-red-500 text-sm">{getFieldError("gender")}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                />
                {getFieldError("date_of_birth") && (
                  <p className="text-red-500 text-sm">{getFieldError("date_of_birth")}</p>
                )}
              </div>
            </div>
          </motion.div>
        )

      case 4:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Activity Level</h2>
              <p className="text-gray-300">How active are you on a typical week?</p>
            </div>
            <div className="grid gap-4">
              {activityOptions.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      formData.activity_level === activity.id
                        ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                    onClick={() => setFormData({ ...formData, activity_level: activity.id })}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{activity.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold text-white">{activity.title}</h3>
                            <span className="text-sm bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
                              {activity.multiplier}
                            </span>
                          </div>
                          <p className="text-gray-300">{activity.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )

      case 5:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Allergies & Restrictions</h2>
              <p className="text-gray-300">Select any food allergies or dietary restrictions</p>
            </div>
            <div className="space-y-6">
              <div>
                <Label className="text-white mb-3 block">Common Allergies</Label>
                <div className="flex flex-wrap gap-2">
                  {commonAllergies.map((allergy) => (
                    <motion.button
                      key={allergy}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAllergyToggle(allergy)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.allergies.includes(allergy)
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                          : "bg-white/10 text-gray-300 hover:bg-white/20"
                      }`}
                    >
                      {allergy}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Other Restrictions</Label>
                <Input
                  value={formData.customAllergy}
                  onChange={(e) => setFormData({ ...formData, customAllergy: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Enter any other dietary restrictions..."
                />
                {getFieldError("allergies") && <p className="text-red-500 text-sm">{getFieldError("allergies")}</p>}
              </div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  const canSubmit = () => {
    return (
      formData.goals &&
      formData.diet_type &&
      formData.weight &&
      formData.height &&
      formData.gender &&
      formData.date_of_birth &&
      formData.activity_level
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">MealMind Setup</span>
                </div>
                <div className="text-white text-sm">
                  Step {currentStep} of {steps.length}
                </div>
              </div>

              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-gray-300">
                  {steps.map((step) => (
                    <span key={step.id} className={currentStep >= step.id ? "text-orange-400" : ""}>
                      {step.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-4xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-6">
            <div className="max-w-4xl mx-auto flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={isSubmitting || (currentStep === steps.length && !canSubmit())}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Profile...
                  </div>
                ) : (
                  <>
                    {currentStep === steps.length ? "Complete Setup" : "Next"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
