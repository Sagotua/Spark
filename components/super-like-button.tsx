"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { PremiumFeaturesService } from "@/lib/premium-features"

interface SuperLikeButtonProps {
  userId: string
  targetUserId: string
  onSuperLike: () => void
  className?: string
}

export default function SuperLikeButton({ userId, targetUserId, onSuperLike, className }: SuperLikeButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleSuperLike = async () => {
    setLoading(true)
    try {
      const result = await PremiumFeaturesService.sendSuperLike(userId, targetUserId)
      if (result.success) {
        onSuperLike()
      }
      alert(result.message)
    } catch (error) {
      console.error("Super like error:", error)
      alert("Failed to send Super Like. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleSuperLike}
      disabled={loading}
      className={`bg-blue-500 hover:bg-blue-600 text-white ${className}`}
      size="lg"
    >
      <Star className="w-6 h-6 fill-current" />
      {loading && <span className="ml-2">Sending...</span>}
    </Button>
  )
}
