"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { authService } from "@/utils/auth-service"
import { ChefHat, Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-pink-900 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">MealMind</span>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="flex justify-center"
        >
          <Loader2 className="w-8 h-8 text-orange-400" />
        </motion.div>
        <p className="text-gray-300 mt-4">Loading your personalized experience...</p>
      </motion.div>
    </div>
  )
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasLoggedOut, setHasLoggedOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = authService.getAuthToken();
      const userData = authService.getUserData();
      console.log("AuthGuard token:", token);
      console.log("AuthGuard userData:", userData);

      if (!authService.isAuthenticated()) {
        if (requireAuth) {
          router.push("/")
          return
        } else {
          setIsAuthenticated(false)
          setIsLoading(false)
          return
        }
      }

      // Verify token with backend
      const user = await authService.getCurrentUser();
      console.log("AuthGuard getCurrentUser:", user);
      setIsAuthenticated(true)
    } catch (error) {
      // Token invalid, redirect to login
      if (!hasLoggedOut) {
        setHasLoggedOut(true)
        await authService.logout()
        if (requireAuth) {
          router.push("/")
        } else {
          setIsAuthenticated(false)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (requireAuth && !isAuthenticated) {
    return null // Will redirect to login
  }

  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from auth pages
    router.push("/dashboard")
    return <LoadingScreen />
  }

  return <>{children}</>
}
