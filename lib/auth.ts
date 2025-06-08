import { supabase, mockUsers } from "./supabase"
import type { User } from "./supabase"

export class AuthService {
  static async signUp(email: string, password: string, userData: Partial<User>) {
    try {
      // If no Supabase, return mock user
      if (!supabase) {
        const mockUser: User = {
          id: Date.now().toString(),
          email,
          name: userData.name || "Demo User",
          age: userData.age || 25,
          bio: userData.bio || "Demo bio",
          photos: userData.photos || ["/placeholder.svg?height=600&width=400"],
          location: userData.location || { lat: 37.7749, lng: -122.4194, city: "San Francisco" },
          preferences: {
            age_range: [18, 35],
            max_distance: 50,
            gender_preference: "all",
            interests: [],
          },
          interests: userData.interests || [],
          gender: userData.gender || "other",
          is_verified: false,
          is_premium: false,
          last_active: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        return { user: mockUser, session: { user: { id: mockUser.id } } }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            email,
            ...userData,
          })
          .select()
          .single()

        if (profileError) throw profileError

        return { user: profileData, session: authData.session }
      }
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    }
  }

  static async signIn(email: string, password: string) {
    try {
      // If no Supabase, return mock user
      if (!supabase) {
        const mockUser = mockUsers.find((u) => u.email === email) || mockUsers[0]
        return { user: mockUser, session: { user: { id: mockUser.id } } }
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authData.user.id)
          .single()

        if (profileError) throw profileError

        return { user: profileData, session: authData.session }
      }
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    }
  }

  static async signOut() {
    if (!supabase) return

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser() {
    try {
      if (!supabase) return null

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) return null

      const { data: profileData, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

      if (error) throw error

      return profileData
    } catch (error) {
      console.error("Get current user error:", error)
      return null
    }
  }

  static async updateProfile(userId: string, updates: Partial<User>) {
    try {
      if (!supabase) {
        // Return mock updated user
        return { ...mockUsers[0], ...updates }
      }

      const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select().single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  static async uploadPhoto(file: File, userId: string): Promise<string> {
    try {
      if (!supabase) {
        // Return mock photo URL
        return "/placeholder.svg?height=600&width=400"
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage.from("photos").upload(fileName, file)

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error("Upload photo error:", error)
      throw error
    }
  }
}
