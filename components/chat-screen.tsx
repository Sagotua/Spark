"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, MoreVertical } from "lucide-react"
import type { Chat, User } from "@/app/page"

interface ChatScreenProps {
  chat: Chat
  currentUser: User
  onSendMessage: (chatId: string, text: string) => void
  onBack: () => void
}

export default function ChatScreen({ chat, currentUser, onSendMessage, onBack }: ChatScreenProps) {
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(chat.id, message.trim())
      setMessage("")
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <img
            src={chat.match.user.photos[0] || "/placeholder.svg"}
            alt={chat.match.user.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="font-semibold">{chat.match.user.name}</h2>
            <p className="text-sm text-gray-500">Online</p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-6 h-6" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.messages.length === 0 ? (
          <div className="text-center py-8">
            <img
              src={chat.match.user.photos[0] || "/placeholder.svg"}
              alt={chat.match.user.name}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
            />
            <h3 className="font-semibold text-lg mb-2">You matched with {chat.match.user.name}!</h3>
            <p className="text-gray-500 text-sm">Start the conversation with a friendly message</p>
          </div>
        ) : (
          chat.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  msg.senderId === currentUser.id ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                <p>{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.senderId === currentUser.id ? "text-pink-100" : "text-gray-500"}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend} disabled={!message.trim()} className="bg-pink-500 hover:bg-pink-600">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
