"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIConversationService, type ConversationStarter } from "@/lib/ai-conversation"
import { Sparkles, Copy, ThumbsUp, Send } from "lucide-react"

interface ConversationStartersProps {
  userId: string
  matchId: string
  userProfile: any
  matchProfile: any
  onSelectStarter: (text: string) => void
  onClose: () => void
}

export default function ConversationStarters({
  userId,
  matchId,
  userProfile,
  matchProfile,
  onSelectStarter,
  onClose,
}: ConversationStartersProps) {
  const [starters, setStarters] = useState<ConversationStarter[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")
  const [copied, setCopied] = useState<string | null>(null)
  const [liked, setLiked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadConversationStarters()
  }, [userId, matchId])

  const loadConversationStarters = async () => {
    try {
      setLoading(true)
      const startersList = await AIConversationService.getConversationStarters(
        userId,
        matchId,
        userProfile,
        matchProfile,
      )
      setStarters(startersList)
    } catch (error) {
      console.error("Error loading conversation starters:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyStarter = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleLikeStarter = async (starter: ConversationStarter) => {
    setLiked((prev) => ({ ...prev, [starter.id]: true }))
    await AIConversationService.saveFavoriteStarter(userId, starter)
  }

  const handleSelectStarter = (text: string) => {
    onSelectStarter(text)
    onClose()
  }

  const filteredStarters = starters.filter((starter) => {
    if (activeCategory === "all") return true
    return starter.category === activeCategory
  })

  return (
    <div className="bg-white rounded-t-xl p-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Sparkles className="w-5 h-5 text-pink-500 mr-2" />
          Conversation Starters
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveCategory}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="funny">Funny</TabsTrigger>
          <TabsTrigger value="flirty">Flirty</TabsTrigger>
          <TabsTrigger value="casual">Casual</TabsTrigger>
          <TabsTrigger value="specific">Personal</TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredStarters.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No conversation starters available</div>
          ) : (
            <div className="space-y-3">
              {filteredStarters.map((starter) => (
                <div
                  key={starter.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors relative group"
                >
                  <p className="pr-16">{starter.text}</p>
                  <div className="absolute right-2 top-2 flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopyStarter(starter.id, starter.text)}
                    >
                      {copied === starter.id ? (
                        <span className="text-green-500 text-xs">Copied!</span>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`w-8 h-8 ${liked[starter.id] ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                      onClick={() => handleLikeStarter(starter)}
                      disabled={liked[starter.id]}
                    >
                      <ThumbsUp className={`w-4 h-4 ${liked[starter.id] ? "fill-pink-500 text-pink-500" : ""}`} />
                    </Button>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      size="sm"
                      className="bg-pink-500 hover:bg-pink-600 text-white"
                      onClick={() => handleSelectStarter(starter.text)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
