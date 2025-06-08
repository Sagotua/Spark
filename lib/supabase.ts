import { createClient } from "@supabase/supabase-js"

// Use fallback values for development/preview
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co"
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-key"

// Only create real client if we have proper credentials
export const supabase = supabaseUrl.includes("demo") ? null : createClient(supabaseUrl, supabaseKey)

// Mock data for when Supabase isn't configured
const mockUsers = [
  {
    id: "1",
    email: "emma@example.com",
    name: "Emma",
    age: 25,
    bio: "Love hiking and coffee ☕️",
    photos: ["/placeholder.svg?height=600&width=400"],
    location: { lat: 37.7749, lng: -122.4194, city: "San Francisco" },
    preferences: {
      age_range: [22, 30] as [number, number],
      max_distance: 50,
      gender_preference: "all",
      interests: ["Hiking", "Coffee"],
    },
    interests: ["Hiking", "Coffee", "Photography"],
    gender: "female",
    is_verified: true,
    is_premium: false,
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    email: "alex@example.com",
    name: "Alex",
    age: 28,
    bio: "Musician and dog lover 🎸🐕",
    photos: ["/placeholder.svg?height=600&width=400"],
    location: { lat: 34.0522, lng: -118.2437, city: "Los Angeles" },
    preferences: {
      age_range: [24, 32] as [number, number],
      max_distance: 75,
      gender_preference: "female",
      interests: ["Music", "Dogs"],
    },
    interests: ["Music", "Dogs", "Travel"],
    gender: "male",
    is_verified: true,
    is_premium: true,
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    email: "sarah@example.com",
    name: "Sarah",
    age: 24,
    bio: "Yoga instructor and foodie 🧘‍♀️🍕",
    photos: ["/placeholder.svg?height=600&width=400"],
    location: { lat: 40.7128, lng: -74.006, city: "New York" },
    preferences: {
      age_range: [22, 28] as [number, number],
      max_distance: 25,
      gender_preference: "all",
      interests: ["Yoga", "Food"],
    },
    interests: ["Yoga", "Food", "Meditation"],
    gender: "female",
    is_verified: false,
    is_premium: false,
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export { mockUsers }

// Database Types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          age: number
          bio: string
          photos: string[]
          location: { lat: number; lng: number; city: string }
          preferences: {
            age_range: [number, number]
            max_distance: number
            gender_preference: string
            interests: string[]
          }
          interests: string[]
          gender: string
          is_verified: boolean
          is_premium: boolean
          last_active: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          age: number
          bio?: string
          photos?: string[]
          location?: { lat: number; lng: number; city: string }
          preferences?: {
            age_range: [number, number]
            max_distance: number
            gender_preference: string
            interests: string[]
          }
          interests?: string[]
          gender: string
          is_verified?: boolean
          is_premium?: boolean
          last_active?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          age?: number
          bio?: string
          photos?: string[]
          location?: { lat: number; lng: number; city: string }
          preferences?: {
            age_range: [number, number]
            max_distance: number
            gender_preference: string
            interests: string[]
          }
          interests?: string[]
          gender?: string
          is_verified?: boolean
          is_premium?: boolean
          last_active?: string
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          is_mutual: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          is_mutual?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          is_mutual?: boolean
        }
      }
      messages: {
        Row: {
          id: string
          match_id: string
          sender_id: string
          content: string
          message_type: "text" | "image" | "video" | "audio"
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          sender_id: string
          content: string
          message_type?: "text" | "image" | "video" | "audio"
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          sender_id?: string
          content?: string
          message_type?: "text" | "image" | "video" | "audio"
          is_read?: boolean
        }
      }
      swipes: {
        Row: {
          id: string
          swiper_id: string
          swiped_id: string
          is_like: boolean
          is_super_like: boolean
          created_at: string
        }
        Insert: {
          id?: string
          swiper_id: string
          swiped_id: string
          is_like: boolean
          is_super_like?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          swiper_id?: string
          swiped_id?: string
          is_like?: boolean
          is_super_like?: boolean
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_id: string
          reason: string
          description: string
          status: "pending" | "reviewed" | "resolved"
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_id: string
          reason: string
          description: string
          status?: "pending" | "reviewed" | "resolved"
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_id?: string
          reason?: string
          description?: string
          status?: "pending" | "reviewed" | "resolved"
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_type: "premium" | "gold" | "platinum"
          status: "active" | "cancelled" | "expired"
          current_period_start: string
          current_period_end: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_type: "premium" | "gold" | "platinum"
          status?: "active" | "cancelled" | "expired"
          current_period_start: string
          current_period_end: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_type?: "premium" | "gold" | "platinum"
          status?: "active" | "cancelled" | "expired"
          current_period_start?: string
          current_period_end?: string
        }
      }
    }
  }
}

export type User = Database["public"]["Tables"]["users"]["Row"]
export type Match = Database["public"]["Tables"]["matches"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type Swipe = Database["public"]["Tables"]["swipes"]["Row"]
export type Report = Database["public"]["Tables"]["reports"]["Row"]
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"]
