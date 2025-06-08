"use client"

import { Button } from "@/components/ui/button"
import { Edit, MapPin, Settings, CheckCircle } from "lucide-react"
import type { User } from "@/lib/supabase"

interface ProfileScreenProps {
  user: User
  onNavigate: (screen: string) => void
}

export default function ProfileScreen({ user, onNavigate }: ProfileScreenProps) {
  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="relative">
        <img src={user.photos[0] || "/placeholder.svg"} alt={user.name} className="w-full h-96 object-cover" />
        <div className="absolute top-6 right-6">
          <Button
            variant="outline"
            size="icon"
            className="bg-white/90 backdrop-blur-sm"
            onClick={() => onNavigate("settings")}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold mr-2">
              {user.name}, {user.age}
            </h1>
            {user.is_verified && <CheckCircle className="w-6 h-6 text-blue-400" />}
          </div>
          <div className="flex items-center mt-2">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{user.location?.city || "Location not set"}</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">About Me</h2>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>

        <p className="text-gray-700 mb-6">{user.bio || "No bio added yet"}</p>

        <div className="mb-6">
          <h3 className="font-semibold mb-3">Interests</h3>
          <div className="flex flex-wrap gap-2">
            {user.interests.length > 0 ? (
              user.interests.map((interest) => (
                <span key={interest} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No interests added yet</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            Add Photos
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate("photo-manager")}>
            Manage Photos
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Edit Preferences
          </Button>
          {!user.is_verified && (
            <Button variant="outline" className="w-full justify-start" onClick={() => onNavigate("photo-verification")}>
              Verify Profile
            </Button>
          )}
          {!user.is_premium && (
            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              onClick={() => onNavigate("premium")}
            >
              Upgrade to Premium
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
