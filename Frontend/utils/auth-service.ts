import { apiClient, AuthError } from "./api-client"

interface RegisterRequest {
  name: string
  email: string
  password: string
  password_confirmation: string
}

interface LoginRequest {
  email: string
  password: string
}

interface AuthResponse {
  success: boolean
  data: {
    user: {
      id: number
      name: string
      email: string
      email_verified_at: string | null
      created_at: string
      updated_at: string
    }
    token: string
  }
  message: string
}

interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
}

class AuthService {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.request("/api/register", {
      method: "POST",
      body: JSON.stringify(data),
    })

    if (response.success && response.data.token) {
      apiClient.setAuthToken(response.data.token)
      this.setUserData(response.data.user)
    }

    return response
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.request("/api/login", {
      method: "POST",
      body: JSON.stringify(data),
    })

    if (response.success && response.data.token) {
      apiClient.setAuthToken(response.data.token)
      this.setUserData(response.data.user)
    }

    return response
  }

  async logout(): Promise<void> {
    try {
      await apiClient.request("/api/logout", {
        method: "POST",
      })
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn("Logout API call failed:", error)
    } finally {
      this.clearAuthData()
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.request("/api/user", {
      method: "GET",
    })

    if (response.data) {
      this.setUserData(response.data)
      return response.data
    }

    throw new AuthError("Failed to get user data")
  }

  getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  }

  getUserData(): User | null {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user_data")
      return userData ? JSON.parse(userData) : null
    }
    return null
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }

  private setUserData(user: User): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("user_data", JSON.stringify(user))
    }
  }

  private clearAuthData(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
    }
  }
}

export const authService = new AuthService()
export type { RegisterRequest, LoginRequest, AuthResponse, User }
