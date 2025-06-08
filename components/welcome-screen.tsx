"use client"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"

interface WelcomeScreenProps {
  onNavigate: (screen: string) => void
}

export default function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-500 to-red-500 text-white p-6">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Heart className="w-16 h-16 text-white fill-current" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Spark</h1>
        <p className="text-lg opacity-90">Find your perfect match</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Button
          onClick={() => onNavigate("register")}
          className="w-full bg-white text-pink-500 hover:bg-gray-100 font-semibold py-3 text-lg"
        >
          Create Account
        </Button>

        <Button
          onClick={() => onNavigate("login")}
          variant="outline"
          className="w-full border-white text-white hover:bg-white hover:text-pink-500 font-semibold py-3 text-lg"
        >
          Sign In
        </Button>
      </div>

      <p className="text-sm opacity-75 mt-8 text-center">
        By tapping Create Account or Sign In, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  )
}
