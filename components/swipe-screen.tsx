"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, X, Zap, RotateCcw } from "lucide-react"
import type { User } from "@/lib/supabase"
import SuperLikeButton from "./super-like-button"
import PremiumFeaturesModal from "./premium-features-modal"

interface SwipeScreenProps {
  users: User[]
  onMatch: (user: User) => void
  currentUser?: User
}

export default function SwipeScreen({ users, onMatch, currentUser }: SwipeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [premiumFeature, setPremiumFeature] = useState<string | undefined>()

  const currentUserProfile = users[currentIndex]

  const handleSwipe = (direction: "left" | "right") => {
    if (direction === "right" && Math.random() > 0.7) {
      onMatch(currentUserProfile)
    }

    setCurrentIndex((prev) => (prev + 1) % users.length)
  }

  const handleSuperLike = () => {
    onMatch(currentUserProfile)
    setCurrentIndex((prev) => (prev + 1) % users.length)
  }

  const handlePremiumFeature = (feature: string) => {
    setPremiumFeature(feature as any)
    setShowPremiumModal(true)
  }

  const handleUpgrade = () => {
    setShowPremiumModal(false)
    // Navigate to premium subscription screen
  }

  if (!currentUserProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No more profiles!</h2>
          <p className="text-gray-600">Check back later for new people in your area.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePremiumFeature("rewind")}
          className="text-orange-500 border-orange-500 hover:bg-orange-50"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <h1 className="text-xl font-bold text-pink-500">Discover</h1>
          <p className="text-sm text-gray-500">{users.length - currentIndex} people nearby</p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePremiumFeature("boost")}
          className="text-purple-500 border-purple-500 hover:bg-purple-50"
        >
          <Zap className="w-5 h-5" />
        </Button>
      </div>

      {/* Profile Card */}
      <div className="flex-1 p-4">
        <div className="relative h-full bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Image */}
          <div className="relative h-3/4">
            <img
              src={currentUserProfile.photos[0] || "/placeholder.svg"}
              alt={currentUserProfile.name}
              className="w-full h-full object-cover"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Profile Info */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h2 className="text-2xl font-bold">
                {currentUserProfile.name}, {currentUserProfile.age}
              </h2>
              {currentUserProfile.job && <p className="text-lg opacity-90">{currentUserProfile.job}</p>}
              {currentUserProfile.bio && (
                <p className="text-sm opacity-80 mt-2 line-clamp-2">{currentUserProfile.bio}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="h-1/4 flex items-center justify-center space-x-6 px-8">
            {/* Pass Button */}
            <Button
              onClick={() => handleSwipe("left")}
              size="lg"
              variant="outline"
              className="w-16 h-16 rounded-full border-2 border-gray-300 hover:border-red-500 hover:bg-red-50"
            >
              <X className="w-8 h-8 text-gray-400 hover:text-red-500" />
            </Button>

            {/* Super Like Button */}
            {currentUser && (
              <SuperLikeButton
                userId={currentUser.id}
                targetUserId={currentUserProfile.id}
                onSuperLike={handleSuperLike}
                className="w-16 h-16 rounded-full"
              />
            )}

            {/* Like Button */}
            <Button
              onClick={() => handleSwipe("right")}
              size="lg"
              className="w-16 h-16 rounded-full bg-pink-500 hover:bg-pink-600"
            >
              <Heart className="w-8 h-8 fill-current" />
            </Button>
          </div>
        </div>
      </div>

      {/* Premium Features Modal */}
      {currentUser && (
        <PremiumFeaturesModal
          userId={currentUser.id}
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onUpgrade={handleUpgrade}
          feature={premiumFeature as any}
        />
      )}
    </div>
  )
}
