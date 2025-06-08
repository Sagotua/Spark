"use client"

import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, X } from "lucide-react"
import type { Match } from "@/app/page"

interface MatchModalProps {
  match: Match
  onClose: () => void
  onSendMessage: () => void
}

export default function MatchModal({ match, onClose, onSendMessage }: MatchModalProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-500 to-red-500 z-50 flex items-center justify-center p-6">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-6 right-6 text-white hover:bg-white/20"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="text-center text-white">
        <div className="mb-8">
          <Heart className="w-20 h-20 mx-auto mb-4 fill-current animate-pulse" />
          <h1 className="text-4xl font-bold mb-2">It's a Match!</h1>
          <p className="text-lg opacity-90">You and {match.user.name} liked each other</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex -space-x-4">
            <img
              src="/placeholder.svg?height=100&width=100"
              alt="You"
              className="w-20 h-20 rounded-full border-4 border-white"
            />
            <img
              src={match.user.photos[0] || "/placeholder.svg"}
              alt={match.user.name}
              className="w-20 h-20 rounded-full border-4 border-white"
            />
          </div>
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          <Button
            onClick={onSendMessage}
            className="w-full bg-white text-pink-500 hover:bg-gray-100 font-semibold py-3"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Send Message
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-white text-white hover:bg-white hover:text-pink-500 font-semibold py-3"
          >
            Keep Swiping
          </Button>
        </div>
      </div>
    </div>
  )
}
