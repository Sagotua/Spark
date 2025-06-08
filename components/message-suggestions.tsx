"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AIConversationService, type MessageSuggestion } from "@/lib/ai-conversation"
import { Sparkles } from "lucide-react"

interface MessageSuggestionsProps {
  userId: string
  matchId: string
  conversationHistory: { sender: string; text: string; timestamp: Date }[]
  onSelectSuggestion: (text: string) => void
}

export default function MessageSuggestions({
  userId,
  matchId,
  conversationHistory,
  onSelectSuggestion,
}: MessageSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<MessageSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (conversationHistory.length > 0) {
      loadSuggestions()
    }
  }, [conversationHistory])

  const loadSuggestions = async () => {
    try {
      setLoading(true)
      const messageSuggestions = await AIConversationService.getMessageSuggestions(userId, matchId, conversationHistory)
      setSuggestions(messageSuggestions)
    } catch (error) {
      console.error("Error loading message suggestions:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || suggestions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.id}
          variant="outline"
          size="sm"
          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center"
          onClick={() => onSelectSuggestion(suggestion.text)}
        >
          <Sparkles className="w-3 h-3 text-pink-500 mr-1" />
          {suggestion.text.length > 30 ? suggestion.text.substring(0, 30) + "..." : suggestion.text}
        </Button>
      ))}
    </div>
  )
}
