"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChefHat, Target, TrendingUp, Calendar, Plus, Eye, Zap, Award, Bell, Settings } from "lucide-react"
import { authService, type User } from "@/utils/auth-service"
import { profileService, type Profile } from "@/utils/profile-service"
import { mealPlanService } from "@/utils/meal-plan-service"
import { ApiError } from "@/utils/api-client"
import { useToast } from "@/components/ui/toast"
import { AuthGuard } from "@/components/auth-guard"

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <motion.p
              className="text-2xl font-bold text-white mt-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {value}
            </motion.p>
            {change && (
              <p className={`text-sm mt-1 flex items-center gap-1 ${change > 0 ? "text-green-400" : "text-red-400"}`}>
                <TrendingUp className="w-3 h-3" />
                {change > 0 ? "+" : ""}
                {change}%
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-r ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

const QuickAction = ({ title, description, icon: Icon, color, onClick, disabled }: any) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Card
      className="bg-white/5 border-white/10 backdrop-blur-xl cursor-pointer hover:bg-white/10 transition-all"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">{title}</h3>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [calorieProgress, setCalorieProgress] = useState(0)

  const router = useRouter()
  const { showSuccessToast, showErrorToast, showLoadingToast, removeToast, showInfoToast } = useToast()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    // Animate calorie progress after profile loads
    if (profile) {
      const timer = setTimeout(() => {
        // Calculate progress based on consumed vs target calories
        const consumed = 1680 // This would come from meal tracking
        const target = profile.daily_calories_target
        const progress = Math.min((consumed / target) * 100, 100)
        setCalorieProgress(progress)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [profile])

  const loadUserData = async () => {
    try {
      setIsLoading(true)

      // Load user info and profile in parallel
      const [userData, profileData] = await Promise.all([authService.getCurrentUser(), profileService.getProfile()])

      setUser(userData)
      setProfile(profileData)

      if (!profileData) {
        // User doesn't have a profile, redirect to onboarding
        router.push("/onboarding")
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Unauthorized, redirect to login
        await authService.logout()
        router.push("/")
      } else {
        showErrorToast("Failed to load profile", "Please refresh the page")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateMealPlan = async () => {
    try {
      setIsGeneratingMealPlan(true)

      const loadingToastId = showLoadingToast(
        "Generating your meal plan...",
        "Our AI is creating personalized recipes just for you",
      )

      const mealPlan = await mealPlanService.generateMealPlan()

      removeToast(loadingToastId)

      showSuccessToast("Meal plan generated!", "Your personalized weekly meal plan is ready")

      // Here you would typically navigate to a meal plan view page
      // or update the UI to show the generated plan
      console.log("Generated meal plan:", mealPlan)
    } catch (error) {
      if (error instanceof ApiError) {
        showErrorToast("Failed to generate meal plan", error.message)
      } else {
        showErrorToast("Something went wrong", "Please try again later")
      }
    } finally {
      setIsGeneratingMealPlan(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      showSuccessToast("Logged out successfully", "See you next time!")
      router.push("/")
    } catch (error) {
      // Logout anyway even if API call fails
      router.push("/")
    }
  }

  // Update stats to use real profile data
  const stats = [
    {
      title: "Daily Calories",
      value: profile ? `1,680 / ${profile.daily_calories_target.toLocaleString()}` : "Loading...",
      change: 12,
      icon: Target,
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Current Goal",
      value: profile ? profile.goals.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Loading...",
      change: null,
      icon: ChefHat,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Diet Type",
      value: profile ? profile.diet_type.charAt(0).toUpperCase() + profile.diet_type.slice(1) : "Loading...",
      change: null,
      icon: Award,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Activity Level",
      value: profile ? profile.activity_level.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Loading...",
      change: null,
      icon: Zap,
      color: "from-blue-500 to-cyan-500",
    },
  ]

  // Update quick actions to include real functionality
  const quickActions = [
    {
      title: "Generate New Plan",
      description: "Create AI-powered meal plan for this week",
      icon: Plus,
      color: "from-orange-500 to-red-500",
      onClick: generateMealPlan,
      disabled: isGeneratingMealPlan,
    },
    {
      title: "View Current Plan",
      description: "See your active meal schedule",
      icon: Eye,
      color: "from-green-500 to-emerald-500",
      onClick: () => showInfoToast("Coming soon!", "Meal plan viewing is being developed"),
    },
    {
      title: "Update Profile",
      description: "Modify your preferences and goals",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-500",
      onClick: () => router.push("/profile/edit"),
    },
    {
      title: "Logout",
      description: "Sign out of your account",
      icon: Calendar,
      color: "from-red-500 to-pink-500",
      onClick: handleLogout,
    },
  ]

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900">
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-white/10 backdrop-blur-xl bg-white/5"
          >
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">MealMind</h1>
                    <p className="text-gray-400 text-sm">
                      {currentTime.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <Bell className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm">
                      JD
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </motion.header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-6 py-8">
            {/* Welcome Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Good {currentTime.getHours() < 12 ? "Morning" : currentTime.getHours() < 18 ? "Afternoon" : "Evening"},
                {user ? ` ${user.name.split(" ")[0]}` : ""}! 👋
              </h2>
              <p className="text-gray-300">You're doing great! Here's your nutrition overview for today.</p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </motion.div>

            {/* Calorie Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Daily Calorie Target
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-medium">{calorieProgress}% of daily goal</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-3">
                      <motion.div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${calorieProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>1,680 consumed</span>
                      <span>{profile ? (profile.daily_calories_target - 1680).toLocaleString() : "0"} remaining</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <QuickAction
                      {...action}
                      disabled={action.disabled}
                      title={action.title}
                      description={action.description}
                      icon={action.icon}
                      color={action.color}
                      onClick={action.onClick}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
