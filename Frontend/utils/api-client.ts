// API Client with comprehensive error handling
class ValidationError extends Error {
  constructor(public errors: Record<string, string[]>) {
    super("Validation failed")
    this.name = "ValidationError"
  }
}

class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthError"
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
}

class ApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

  async request(endpoint: string, options: RequestOptions = {}) {
    const url = `${this.baseUrl}${endpoint}`
    const token = this.getAuthToken()

    const config: RequestInit = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Handle Laravel validation errors
        if (response.status === 422) {
          throw new ValidationError(errorData.errors || {})
        }

        // Handle authentication errors
        if (response.status === 401) {
          this.clearAuthToken()
          throw new AuthError("Session expired. Please login again.")
        }

        throw new ApiError(errorData.message || `Request failed with status ${response.status}`, response.status)
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return null
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthError || error instanceof ApiError) {
        throw error
      }
      throw new ApiError("Network error occurred. Please check your connection.")
    }
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_token")
    }
    return null
  }

  private clearAuthToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("user_data")
    }
  }

  setAuthToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }
}

export const apiClient = new ApiClient()
export { ValidationError, AuthError, ApiError }
