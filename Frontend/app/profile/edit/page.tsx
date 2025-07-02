"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { profileService, type CreateProfileRequest, type Profile } from "@/utils/profile-service"
import { ValidationError, ApiError } from "@/utils/api-client"
import { AuthGuard } from "@/components/auth-guard"
import { Scale, Ruler, User, Calendar, Target, Leaf, Activity, AlertTriangle, Loader2 } from "lucide-react"

const goalOptions = [
  { id: "lose_weight", title: "Lose Weight" },
  { id: "gain_muscle", title: "Gain Muscle" },
  { id: "maintain_weight", title: "Maintain Weight" },
]
const dietOptions = [
  { id: "keto", title: "Keto" },
  { id: "vegan", title: "Vegan" },
  { id: "vegetarian", title: "Vegetarian" },
  { id: "paleo", title: "Paleo" },
  { id: "mediterranean", title: "Mediterranean" },
  { id: "none", title: "No Preference" },
]
const activityOptions = [
  { id: "sedentary", title: "Sedentary" },
  { id: "light", title: "Light Activity" },
  { id: "moderate", title: "Moderate Activity" },
  { id: "very_active", title: "Very Active" },
]
const commonAllergies = ["Peanuts", "Shellfish", "Dairy", "Gluten", "Eggs", "Soy", "Fish", "Tree Nuts"]

export default function EditProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
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

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true)
      try {
        const profile = await profileService.getProfile()
        if (profile) {
          setFormData({
            goals: profile.goals,
            diet_type: profile.diet_type,
            weight: profile.weight.toString(),
            height: profile.height.toString(),
            gender: profile.gender,
            date_of_birth: profile.date_of_birth,
            activity_level: profile.activity_level,
            allergies: Array.isArray(profile.allergies) ? profile.allergies : [],
            customAllergy: "",
          })
        }
      } catch (error) {
        showErrorToast("Failed to load profile", "Please refresh the page")
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleAllergyToggle = (allergy: string) => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationErrors({})
    setIsSubmitting(true)
    let loadingToastId: string | undefined
    try {
      loadingToastId = showLoadingToast("Updating profile...", "Saving your changes")
      let allergies: string[] | null = [...formData.allergies]
      if (formData.customAllergy.trim()) {
        allergies.push(formData.customAllergy.trim())
      }
      if (allergies.length === 0) {
        allergies = null
      }
      const profileData: CreateProfileRequest = {
        goals: formData.goals as "lose_weight" | "gain_muscle" | "maintain_weight",
        diet_type: formData.diet_type,
        allergies,
        weight: Number.parseFloat(formData.weight),
        height: Number.parseFloat(formData.height),
        activity_level: formData.activity_level as "sedentary" | "light" | "moderate" | "very_active",
        gender: formData.gender as "male" | "female",
        date_of_birth: formData.date_of_birth,
      }
      await profileService.updateProfile(profileData)
      if (loadingToastId) removeToast(loadingToastId)
      showSuccessToast("Profile updated!", "Your preferences have been saved.")
      setTimeout(() => router.push("/dashboard"), 1500)
    } catch (error) {
      if (loadingToastId) removeToast(loadingToastId)
      if (error instanceof ValidationError) {
        setValidationErrors(error.errors)
        showErrorToast("Please check your input", "Some fields need your attention")
      } else if (error instanceof ApiError) {
        showErrorToast("Update failed", error.message)
      } else {
        showErrorToast("Update failed", "Please try again later")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFieldError = (fieldName: string) => validationErrors[fieldName]?.[0]

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-orange-400" /> Edit Profile
            </h2>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Target className="w-4 h-4" /> Goal
                    </Label>
                    <select
                      value={formData.goals}
                      onChange={e => setFormData({ ...formData, goals: e.target.value })}
                      className="bg-white/10 border-white/20 text-white rounded-md p-2"
                    >
                      <option value="" className="text-orange-400 bg-neutral-900">Select goal</option>
                      {goalOptions.map(goal => (
                        <option key={goal.id} value={goal.id} className="text-orange-400 bg-neutral-900">{goal.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Leaf className="w-4 h-4" /> Diet Type
                    </Label>
                    <select
                      value={formData.diet_type}
                      onChange={e => setFormData({ ...formData, diet_type: e.target.value })}
                      className="bg-white/10 border-white/20 text-white rounded-md p-2"
                    >
                      <option value="" className="text-orange-400 bg-neutral-900">Select diet type</option>
                      {dietOptions.map(diet => (
                        <option key={diet.id} value={diet.id} className="text-orange-400 bg-neutral-900">{diet.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Scale className="w-4 h-4" /> Weight (kg)
                    </Label>
                    <Input
                      type="number"
                      value={formData.weight}
                      onChange={e => setFormData({ ...formData, weight: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="70"
                    />
                    {getFieldError("weight") && <p className="text-red-500 text-sm">{getFieldError("weight")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Ruler className="w-4 h-4" /> Height (cm)
                    </Label>
                    <Input
                      type="number"
                      value={formData.height}
                      onChange={e => setFormData({ ...formData, height: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="175"
                    />
                    {getFieldError("height") && <p className="text-red-500 text-sm">{getFieldError("height")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <User className="w-4 h-4" /> Gender
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["male", "female"].map(gender => (
                        <Button
                          key={gender}
                          type="button"
                          variant={formData.gender === gender ? "default" : "outline"}
                          onClick={() => setFormData({ ...formData, gender })}
                          className={
                            formData.gender === gender
                              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                              : "bg-neutral-800 text-white border-white/20 hover:bg-neutral-700 hover:text-white"
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
                      <Calendar className="w-4 h-4" /> Date of Birth
                    </Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                    {getFieldError("date_of_birth") && <p className="text-red-500 text-sm">{getFieldError("date_of_birth")}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white flex items-center gap-2">
                      <Activity className="w-4 h-4" /> Activity Level
                    </Label>
                    <select
                      value={formData.activity_level}
                      onChange={e => setFormData({ ...formData, activity_level: e.target.value })}
                      className="bg-white/10 border-white/20 text-white rounded-md p-2"
                    >
                      <option value="" className="text-orange-400 bg-neutral-900">Select activity level</option>
                      {activityOptions.map(activity => (
                        <option key={activity.id} value={activity.id} className="text-orange-400 bg-neutral-900">{activity.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Allergies */}
                <div className="space-y-2 mt-4">
                  <Label className="text-white mb-3 block flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" /> Allergies & Restrictions
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {commonAllergies.map(allergy => (
                      <Button
                        key={allergy}
                        type="button"
                        variant={formData.allergies.includes(allergy) ? "default" : "outline"}
                        onClick={() => handleAllergyToggle(allergy)}
                        className={
                          formData.allergies.includes(allergy)
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                            : "bg-white/10 text-gray-300 border-white/20 hover:bg-white/20"
                        }
                      >
                        {allergy}
                      </Button>
                    ))}
                  </div>
                  <Input
                    value={formData.customAllergy}
                    onChange={e => setFormData({ ...formData, customAllergy: e.target.value })}
                    className="bg-white/10 border-white/20 text-white mt-2"
                    placeholder="Enter any other dietary restrictions..."
                  />
                  {getFieldError("allergies") && <p className="text-red-500 text-sm">{getFieldError("allergies")}</p>}
                </div>
                {/* Submit */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Changes...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
} 