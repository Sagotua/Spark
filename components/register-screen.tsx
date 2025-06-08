"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, UserIcon, Mail, Lock, Calendar } from "lucide-react"
import { AuthService } from "@/lib/auth"
import type { User } from "@/lib/supabase"

interface RegisterScreenProps {
  onRegister: (user: User) => void
  onNavigate: (screen: string) => void
}

export default function RegisterScreen({ onRegister, onNavigate }: RegisterScreenProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "other" as "male" | "female" | "other",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.age) {
      setError("Please fill in all fields")
      return
    }

    if (Number.parseInt(formData.age) < 18) {
      setError("You must be at least 18 years old")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const userData = {
        name: formData.name,
        age: Number.parseInt(formData.age),
        gender: formData.gender,
        bio: "",
        photos: ["/placeholder.svg?height=600&width=400"],
        location: { lat: 37.7749, lng: -122.4194, city: "San Francisco" },
        preferences: {
          age_range: [18, 35] as [number, number],
          max_distance: 50,
          gender_preference: "all",
          interests: [],
        },
        interests: [],
        is_verified: false,
        is_premium: false,
      }

      const result = await AuthService.signUp(formData.email, formData.password, userData)
      if (result?.user) {
        onRegister(result.user)
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("welcome")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold ml-4">Create Account</h1>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="register-name" className="text-sm font-medium text-gray-700">Name</label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              id="register-name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="register-email" className="text-sm font-medium text-gray-700">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              id="register-email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="register-password" className="text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              id="register-password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="register-age" className="text-sm font-medium text-gray-700">Age</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              id="register-age"
              type="number"
              placeholder="Enter your age"
              value={formData.age}
              onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, gender: e.target.value as "male" | "female" | "other" }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <Button
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : null}
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>

        <div className="text-center">
          <Button variant="link" className="text-pink-500" onClick={() => onNavigate("login")}>
            Already have an account? Sign in
          </Button>
        </div>
      </div>
    </div>
  )
}
