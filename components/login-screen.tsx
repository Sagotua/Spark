"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Mail, Lock } from "lucide-react"
import { AuthService } from "@/lib/auth"
import type { User } from "@/lib/supabase"

interface LoginScreenProps {
  onLogin: (user: User) => void
  onNavigate: (screen: string) => void
}

export default function LoginScreen({ onLogin, onNavigate }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await AuthService.signIn(email, password)
      if (result?.user) {
        onLogin(result.user)
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Invalid email or password")
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
        <h1 className="text-2xl font-bold ml-4">Sign In</h1>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium text-gray-700">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="text-sm font-medium text-gray-700">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : null}
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>

        <div className="text-center">
          <Button variant="link" className="text-pink-500" onClick={() => onNavigate("register")}>
            Don't have an account? Sign up
          </Button>
        </div>

        {/* Demo credentials hint */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
          <p className="text-blue-800 text-sm font-medium mb-1">Demo Mode</p>
          <p className="text-blue-600 text-xs">Use any email (e.g., emma@example.com) with any password to sign in</p>
        </div>
      </div>
    </div>
  )
}
