import { apiClient } from "./api-client"

interface CreateProfileRequest {
  goals: "lose_weight" | "gain_muscle" | "maintain_weight"
  diet_type: string
  allergies: string[] | null
  weight: number
  height: number
  activity_level: "sedentary" | "light" | "moderate" | "very_active"
  gender: "male" | "female"
  date_of_birth: string // YYYY-MM-DD format
  daily_calories_target?: number // Optional override
}

interface Profile extends CreateProfileRequest {
  id: number
  user_id: number
  daily_calories_target: number // AI-calculated value
  created_at: string
  updated_at: string
}

interface ProfileResponse {
  success: boolean
  data: Profile
  message: string
}

class ProfileService {
  async createProfile(data: CreateProfileRequest): Promise<Profile> {
    const response = await apiClient.request("/api/profile", {
      method: "POST",
      body: JSON.stringify(data),
    })
    // Accept { data: { ...profile } } or { profile: { ...profile } }
    if (response?.data) return response.data
    if (response?.profile) return response.profile
    throw new Error("Profile creation response missing profile data")
  }

  async getProfile(): Promise<Profile | null> {
    try {
      const response = await apiClient.request("/api/profile", {
        method: "GET",
      });
      // Accept { data: { ...profile } } or { ...profile }
      const profile = response?.data?.id ? response.data : response?.id ? response : null;
      return profile;
    } catch (error: any) {
      if (error.status === 404) {
        return null; // Profile doesn't exist yet
      }
      throw error;
    }
  }

  async updateProfile(data: Partial<CreateProfileRequest>): Promise<Profile> {
    const response: ProfileResponse = await apiClient.request("/api/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })

    return response.data
  }

  async deleteProfile(): Promise<void> {
    await apiClient.request("/api/profile", {
      method: "DELETE",
    })
  }
}

export const profileService = new ProfileService()
export type { CreateProfileRequest, Profile, ProfileResponse }
