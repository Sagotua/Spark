"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, Search } from "lucide-react"
import type { Chat } from "@/app/page"

interface ChatListScreenProps {
  chats: Chat[]
  onSelectChat: (chat: Chat) => void
}

export default function ChatListScreen({ chats, onSelectChat }: ChatListScreenProps) {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <Button variant="ghost" size="icon">
            <Search className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">No messages yet</h2>
          <p className="text-gray-500">Start swiping to find matches and begin conversations!</p>
        </div>
      ) : (
        <div className="divide-y">
          {chats.map((chat) => (
            <div key={chat.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => onSelectChat(chat)}>
              <div className="flex items-center space-x-3">
                <img
                  src={chat.match.user.photos[0] || "/placeholder.svg"}
                  alt={chat.match.user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">{chat.match.user.name}</h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">{formatTime(chat.lastMessage.timestamp)}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{chat.lastMessage?.text || "Say hello!"}</p>
                </div>
                {chat.lastMessage && <div className="w-3 h-3 bg-pink-500 rounded-full"></div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
