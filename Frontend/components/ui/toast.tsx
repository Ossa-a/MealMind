"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Toast {
  id: string
  type: "success" | "error" | "info" | "loading"
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, "id">) => string
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const showToast = React.useCallback((toast: Omit<Toast, "id">): string => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    if (toast.type !== "loading" && toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration || 5000)
    }

    return id
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    loading: Loader2,
  }

  const colors = {
    success: "from-green-500 to-emerald-500",
    error: "from-red-500 to-pink-500",
    info: "from-blue-500 to-cyan-500",
    loading: "from-orange-500 to-red-500",
  }

  const Icon = icons[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4 min-w-[300px] max-w-[400px] shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <div className={`p-1 rounded-full bg-gradient-to-r ${colors[toast.type]}`}>
          <Icon className={`w-4 h-4 text-white ${toast.type === "loading" ? "animate-spin" : ""}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-semibold text-sm">{toast.title}</h4>
          {toast.description && <p className="text-gray-300 text-xs mt-1">{toast.description}</p>}
        </div>
        {toast.type !== "loading" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(toast.id)}
            className="text-gray-400 hover:text-white p-1 h-auto"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  const showSuccessToast = (title: string, description?: string) => {
    context.showToast({ type: "success", title, description })
  }

  const showErrorToast = (title: string, description?: string) => {
    context.showToast({ type: "error", title, description })
  }

  const showInfoToast = (title: string, description?: string) => {
    context.showToast({ type: "info", title, description })
  }

  const showLoadingToast = (title: string, description?: string) => {
    return context.showToast({ type: "loading", title, description, duration: 0 })
  }

  return {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showLoadingToast,
    removeToast: context.removeToast,
  }
}
