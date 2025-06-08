"use client"

import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, User, Settings } from "lucide-react"

interface BottomNavigationProps {
  currentScreen: string
  onNavigate: (screen: string) => void
  unreadChats: number
}

export default function BottomNavigation({ currentScreen, onNavigate, unreadChats }: BottomNavigationProps) {
  const navItems = [
    { id: "swipe", icon: Heart, label: "Discover" },
    { id: "chats", icon: MessageCircle, label: "Messages", badge: unreadChats },
    { id: "profile", icon: User, label: "Profile" },
    { id: "settings", icon: Settings, label: "Settings" },
  ]

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentScreen === item.id

          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`flex flex-col items-center space-y-1 p-2 relative ${
                isActive ? "text-pink-500" : "text-gray-500"
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
              <span className="text-xs">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </div>
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
