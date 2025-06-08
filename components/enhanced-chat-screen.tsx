"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, Sparkles, BarChart2, Video, Mic, Phone, Shield, MapPin, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import type { Chat, Message } from "@/app/page"
import type { User } from "@/lib/supabase"
import ConversationStarters from "./conversation-starters"
import MessageSuggestions from "./message-suggestions"
import ConversationInsights from "./conversation-insights"
import VoiceRecorder from "./voice-recorder"
import VoicePlayer from "./voice-player"
import EmergencyFeatures from "./emergency-features"
import LocationSharing from "./location-sharing"

interface EnhancedChatScreenProps {
  chat: Chat
  currentUser: User
  onBack: () => void
  onStartVideoCall?: () => void
}

interface VoiceMessage extends Message {
  type: "voice"
  audioUrl: string
  duration: number
  waveform?: number[]
}

export default function EnhancedChatScreen({ chat, currentUser, onBack, onStartVideoCall }: EnhancedChatScreenProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<(Message | VoiceMessage)[]>(chat.messages)
  const [showStartersModal, setShowStartersModal] = useState(false)
  const [showInsightsModal, setShowInsightsModal] = useState(false)
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const matchUser = chat.match.user

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Simulate typing indicator
    const typingInterval = setInterval(() => {
      setIsTyping(Math.random() > 0.7)
    }, 5000)

    return () => clearInterval(typingInterval)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: message,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setMessage("")

    // Simulate reply after random delay
    if (Math.random() > 0.7) {
      simulateReply()
    }
  }

  const handleVoiceMessage = (audioBlob: Blob, duration: number, waveform: number[]) => {
    const audioUrl = URL.createObjectURL(audioBlob)

    const voiceMessage: VoiceMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: "Voice message",
      timestamp: new Date(),
      type: "voice",
      audioUrl,
      duration,
      waveform,
    }

    setMessages((prev) => [...prev, voiceMessage])
    setShowVoiceRecorder(false)

    // Simulate voice reply
    if (Math.random() > 0.6) {
      simulateVoiceReply()
    }
  }

  const simulateReply = () => {
    setTimeout(
      () => {
        setIsTyping(true)

        setTimeout(
          () => {
            const replies = [
              "That's interesting! Tell me more.",
              "I was just thinking about that!",
              "Haha, that's funny 😄",
              "I completely agree with you.",
              "What else do you enjoy doing?",
              "That sounds amazing!",
              "I've never tried that before, but I'd love to!",
            ]

            const newReply: Message = {
              id: Date.now().toString(),
              senderId: matchUser.id,
              text: replies[Math.floor(Math.random() * replies.length)],
              timestamp: new Date(),
            }

            setMessages((prev) => [...prev, newReply])
            setIsTyping(false)
          },
          1500 + Math.random() * 2000,
        )
      },
      1000 + Math.random() * 3000,
    )
  }

  const simulateVoiceReply = () => {
    setTimeout(
      () => {
        // Create a mock voice message from the match
        const mockVoiceMessage: VoiceMessage = {
          id: Date.now().toString(),
          senderId: matchUser.id,
          text: "Voice message",
          timestamp: new Date(),
          type: "voice",
          audioUrl: "/placeholder-audio.mp3", // Mock audio URL
          duration: 8 + Math.random() * 15, // 8-23 seconds
          waveform: Array.from({ length: 50 }, () => Math.random() * 100),
        }

        setMessages((prev) => [...prev, mockVoiceMessage])
      },
      2000 + Math.random() * 3000,
    )
  }

  const handleSelectStarter = (text: string) => {
    setMessage(text)
  }

  const handleSelectSuggestion = (text: string) => {
    setMessage(text)
  }

  const getConversationHistory = () => {
    return messages.map((msg) => ({
      sender: msg.senderId,
      text: msg.text,
      timestamp: msg.timestamp,
    }))
  }

  const formatMessageTime = (timestamp: Date) => {
    return format(new Date(timestamp), "h:mm a")
  }

  const isFirstMessageOfGroup = (index: number) => {
    if (index === 0) return true
    return messages[index].senderId !== messages[index - 1].senderId
  }

  const isLastMessageOfGroup = (index: number) => {
    if (index === messages.length - 1) return true
    return messages[index].senderId !== messages[index + 1].senderId
  }

  const isVoiceMessage = (msg: Message | VoiceMessage): msg is VoiceMessage => {
    return "type" in msg && msg.type === "voice"
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 flex items-center border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center ml-2">
          <div className="relative">
            <img
              src={matchUser.photos[0] || "/placeholder.svg"}
              alt={matchUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {matchUser.is_verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                <Shield className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="ml-3">
            <div className="flex items-center">
              <h2 className="font-semibold">{matchUser.name}</h2>
              {matchUser.is_verified && <Shield className="w-4 h-4 text-blue-500 ml-1" />}
            </div>
            <p className="text-xs text-gray-500">
              {isTyping ? (
                <span className="text-green-500">Typing...</span>
              ) : (
                `Matched ${format(new Date(chat.match.timestamp), "MMM d")}`
              )}
            </p>
          </div>
        </div>
        <div className="ml-auto flex space-x-1">
          <Button variant="ghost" size="icon" onClick={() => setShowLocationModal(true)} title="Share Location">
            <MapPin className="w-5 h-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowEmergencyModal(true)} title="Safety Features">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </Button>
          <Button variant="ghost" size="icon">
            <Phone className="w-5 h-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowInsightsModal(true)}>
            <BarChart2 className="w-5 h-5 text-gray-600" />
          </Button>
          {onStartVideoCall && (
            <Button variant="ghost" size="icon" onClick={onStartVideoCall}>
              <Video className="w-5 h-5 text-gray-600" />
            </Button>
          )}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-blue-50 border-b border-blue-200 p-3">
        <div className="flex items-center text-sm text-blue-700">
          <Shield className="w-4 h-4 mr-2" />
          <span>
            Stay safe! Never share personal info like your address or financial details.
            <button className="underline ml-1" onClick={() => setShowEmergencyModal(true)}>
              Safety tips
            </button>
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-pink-100 rounded-full p-4 mb-4">
              <Sparkles className="w-8 h-8 text-pink-500" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Start a conversation with {matchUser.name}</h3>
            <p className="text-gray-500 mb-4 max-w-xs">Send a message or voice note to break the ice!</p>
            <div className="flex space-x-2">
              <Button onClick={() => setShowStartersModal(true)} className="bg-pink-500 hover:bg-pink-600 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Get Conversation Starters
              </Button>
              <Button onClick={() => setShowVoiceRecorder(true)} variant="outline">
                <Mic className="w-4 h-4 mr-2" />
                Send Voice Note
              </Button>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSender = msg.senderId === currentUser.id
            const showAvatar = !isSender && isFirstMessageOfGroup(index)
            const isFirstInGroup = isFirstMessageOfGroup(index)
            const isLastInGroup = isLastMessageOfGroup(index)

            return (
              <div
                key={msg.id}
                className={`flex ${isSender ? "justify-end" : "justify-start"} ${
                  isFirstInGroup && index > 0 ? "mt-4" : ""
                }`}
              >
                {!isSender && showAvatar ? (
                  <img
                    src={matchUser.photos[0] || "/placeholder.svg"}
                    alt={matchUser.name}
                    className="w-8 h-8 rounded-full mr-2 self-end"
                  />
                ) : (
                  !isSender && <div className="w-8 mr-2" />
                )}
                <div
                  className={`max-w-[75%] ${isVoiceMessage(msg) ? "p-2" : "px-4 py-2"} rounded-2xl ${
                    isSender ? "bg-pink-500 text-white rounded-br-none" : "bg-white border rounded-bl-none"
                  } ${isFirstInGroup ? (isSender ? "rounded-tr-2xl" : "rounded-tl-2xl") : ""} ${
                    isLastInGroup ? (isSender ? "rounded-br-none" : "rounded-bl-none") : ""
                  }`}
                >
                  {isVoiceMessage(msg) ? (
                    <VoicePlayer
                      audioUrl={msg.audioUrl}
                      duration={msg.duration}
                      waveform={msg.waveform}
                      isOwn={isSender}
                    />
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  <p className={`text-xs mt-1 ${isSender ? "text-pink-100" : "text-gray-500"}`}>
                    {formatMessageTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        {isTyping && (
          <div className="flex justify-start">
            <img
              src={matchUser.photos[0] || "/placeholder.svg"}
              alt={matchUser.name}
              className="w-8 h-8 rounded-full mr-2"
            />
            <div className="bg-white border rounded-2xl rounded-bl-none px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white p-4 border-t">
        <MessageSuggestions
          userId={currentUser.id}
          matchId={matchUser.id}
          conversationHistory={getConversationHistory()}
          onSelectSuggestion={handleSelectSuggestion}
        />
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => setShowStartersModal(true)}>
            <Sparkles className="w-5 h-5 text-pink-500" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${matchUser.name}...`}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => setShowVoiceRecorder(true)}>
            <Mic className="w-5 h-5 text-pink-500" />
          </Button>
          <Button
            className="bg-pink-500 hover:bg-pink-600 shrink-0"
            size="icon"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <VoiceRecorder
              onSend={handleVoiceMessage}
              onCancel={() => setShowVoiceRecorder(false)}
              recipientName={matchUser.name}
            />
          </div>
        </div>
      )}

      {/* Emergency Features Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <EmergencyFeatures
            currentUser={currentUser}
            matchUser={matchUser}
            onClose={() => setShowEmergencyModal(false)}
          />
        </div>
      )}

      {/* Location Sharing Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <LocationSharing
              currentUser={currentUser}
              matchUser={matchUser}
              onClose={() => setShowLocationModal(false)}
            />
          </div>
        </div>
      )}

      {/* Conversation Starters Modal */}
      {showStartersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <ConversationStarters
            userId={currentUser.id}
            matchId={matchUser.id}
            userProfile={currentUser}
            matchProfile={matchUser}
            onSelectStarter={handleSelectStarter}
            onClose={() => setShowStartersModal(false)}
          />
        </div>
      )}

      {/* Conversation Insights Modal */}
      {showInsightsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <ConversationInsights
            conversationHistory={getConversationHistory()}
            onClose={() => setShowInsightsModal(false)}
          />
        </div>
      )}
    </div>
  )
}
