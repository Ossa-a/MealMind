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

// Actual backend response format
interface LoginResponse {
  access_token: string
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
    const response: LoginResponse = await apiClient.request("/api/login", {
      method: "POST",
      body: JSON.stringify(data),
    })

    // Handle the actual backend response format
    if (response && response.access_token) {
      apiClient.setAuthToken(response.access_token)
      
      // Get user data after successful login
      try {
        const userData = await this.getCurrentUser()
        this.setUserData(userData)
        
        // Return a compatible response format
        return {
          success: true,
          data: {
            user: userData,
            token: response.access_token
          },
          message: "Login successful"
        }
      } catch (error) {
        // If we can't get user data, still consider login successful
        return {
          success: true,
          data: {
            user: {
              id: 0,
              name: "User",
              email: data.email,
              email_verified_at: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            token: response.access_token
          },
          message: "Login successful"
        }
      }
    }

    throw new AuthError("Login failed - no token received")
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

    // Accept { data: { ...user } }, { user: { ...user } }, or { ...user }
    const user =
      response?.data?.id
        ? response.data
        : response?.user?.id
        ? response.user
        : response?.id
        ? response
        : null;

    if (user && user.id) {
      this.setUserData(user);
      return user;
    }
    throw new AuthError("Failed to get user data");
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

  setAuthToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
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
