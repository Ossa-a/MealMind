"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ChefHat, Sparkles, Brain, Utensils, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react"
import { authService, type RegisterRequest, type LoginRequest } from "@/utils/auth-service"
import { profileService } from "@/utils/profile-service"
import { ValidationError, AuthError, ApiError } from "@/utils/api-client"
import { useToast } from "@/components/ui/toast"

const FloatingFood = () => {
  const foodItems = ["🍎", "🥑", "🥕", "🍇", "🥦", "🍊", "🫐", "🍓"]
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {foodItems.map((food, index) => (
        <motion.div
          key={index}
          className="absolute text-2xl opacity-20"
          initial={{
            x: Math.random() * dimensions.width,
            y: dimensions.height + 50,
            rotate: 0,
          }}
          animate={{
            y: -50,
            rotate: 360,
            x: Math.random() * dimensions.width,
          }}
          transition={{
            duration: Math.random() * 10 + 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
            delay: Math.random() * 5,
          }}
        >
          {food}
        </motion.div>
      ))}
    </div>
  )
}

export default function LandingPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState("")

  const router = useRouter()
  const { showSuccessToast, showErrorToast, showLoadingToast, removeToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setGeneralError("")
    setIsLoading(true)

    try {
      if (isLogin) {
        await handleLogin({
          email: formData.email,
          password: formData.password,
        })
      } else {
        await handleRegister({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
        })
      }
    } catch (error) {
      console.error("Auth error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (loginData: LoginRequest) => {
    const loadingToastId = showLoadingToast("Signing you in...", "Please wait while we authenticate your account")
    try {
      const response = await authService.login(loginData)

      if (response.success) {
        showSuccessToast("Welcome back!", `Hello ${response.data.user.name}`)

        // Check if user has profile
        const profile = await profileService.getProfile()
        console.log("Profile after login:", profile)
        if (profile) {
          router.push("/dashboard")
        } else {
          router.push("/onboarding")
        }
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        setFieldErrors(error.errors)
        showErrorToast("Please check your input", "Some fields need your attention")
      } else if (error instanceof AuthError || error instanceof ApiError) {
        setGeneralError(error.message)
        showErrorToast("Login failed", error.message)
      } else {
        setGeneralError("An unexpected error occurred")
        showErrorToast("Login failed", "Please try again later")
      }
    } finally {
      if (loadingToastId) removeToast(loadingToastId)
    }
  }

  const handleRegister = async (registerData: RegisterRequest) => {
    const loadingToastId = showLoadingToast("Creating your account...", "Setting up your MealMind profile")
    try {
      const response = await authService.register(registerData)

      if (loadingToastId) removeToast(loadingToastId)

      if (response.success) {
        showSuccessToast("Account created!", `Welcome to MealMind, ${response.data.user.name}`)
        router.push("/onboarding")
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        setFieldErrors(error.errors)
        showErrorToast("Please check your input", "Some fields need your attention")
      } else if (error instanceof ApiError) {
        setGeneralError(error.message)
        showErrorToast("Registration failed", error.message)
      } else {
        setGeneralError("An unexpected error occurred")
        showErrorToast("Registration failed", "Please try again later")
      }
    }
  }

  // Add error display helper
  const getFieldError = (fieldName: string) => {
    return fieldErrors[fieldName]?.[0]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 relative overflow-hidden">
      <FloatingFood />

      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl">
                <ChefHat className="w-8 h-8" />
              </div>
              <span className="text-2xl font-bold">MealMind</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-5xl lg:text-6xl font-bold leading-tight"
            >
              AI-Powered
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                {" "}
                Meal Planning
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-xl text-gray-300 leading-relaxed"
            >
              Transform your nutrition journey with personalized meal plans powered by advanced AI. Get custom
              recipes, track your goals, and achieve optimal health.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-orange-400" />
                <span className="text-sm">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-400" />
                <span className="text-sm">Personalized</span>
              </div>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-400" />
                <span className="text-sm">Delicious</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="flex justify-center gap-1 mb-4">
                    <Button
                      variant={isLogin ? "default" : "ghost"}
                      onClick={() => setIsLogin(true)}
                      className={`px-6 ${isLogin ? "bg-gradient-to-r from-orange-500 to-red-500" : "text-white hover:bg-white/10"}`}
                    >
                      Sign In
                    </Button>
                    <Button
                      variant={!isLogin ? "default" : "ghost"}
                      onClick={() => setIsLogin(false)}
                      className={`px-6 ${!isLogin ? "bg-gradient-to-r from-orange-500 to-red-500" : "text-white hover:bg-white/10"}`}
                    >
                      Sign Up
                    </Button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.form
                    key={isLogin ? "login" : "signup"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="name" className="text-white">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-400"
                          placeholder="Enter your full name"
                        />
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-400"
                        placeholder="Enter your email"
                      />
                      {getFieldError("email") && (
                        <p className="text-red-400 text-sm mt-1">{getFieldError("email")}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-400 pr-10"
                          placeholder="Enter your password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {getFieldError("password") && (
                        <p className="text-red-400 text-sm mt-1">{getFieldError("password")}</p>
                      )}
                    </div>

                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="confirmPassword" className="text-white">
                          Confirm Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-orange-400"
                          placeholder="Confirm your password"
                        />
                      </motion.div>
                    )}

                    {generalError && (
                      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                        <p className="text-red-300 text-sm">{generalError}</p>
                      </div>
                    )}

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 rounded-lg shadow-lg disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {isLogin ? "Signing In..." : "Creating Account..."}
                          </div>
                        ) : (
                          <>
                            {isLogin ? "Sign In" : "Create Account"}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.form>
                </AnimatePresence>

                {isLogin && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-4"
                  >
                    <Button variant="link" className="text-orange-400 hover:text-orange-300">
                      Forgot your password?
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
