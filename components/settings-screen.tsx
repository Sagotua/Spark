"use client"

import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Bell,
  Shield,
  Heart,
  CreditCard,
  HelpCircle,
  LogOut,
  Crown,
  Camera,
  Filter,
  MapPin,
  Video,
} from "lucide-react"

interface SettingsScreenProps {
  onNavigate: (screen: string) => void
}

export default function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const settingsItems = [
    {
      icon: Crown,
      label: "Upgrade to Premium",
      description: "Unlock premium features",
      action: () => onNavigate("premium"),
      color: "text-purple-500",
    },
    {
      icon: Camera,
      label: "Photo Verification",
      description: "Verify your identity",
      action: () => onNavigate("photo-verification"),
      color: "text-blue-500",
    },
    {
      icon: Filter,
      label: "Discovery Filters",
      description: "Customize who you see",
      action: () => onNavigate("discovery-filters"),
      color: "text-pink-500",
    },
    {
      icon: Bell,
      label: "Notifications",
      description: "Push notifications, quiet hours",
      action: () => onNavigate("notification-settings"),
      color: "text-green-500",
    },
    {
      icon: MapPin,
      label: "Location",
      description: "Update your location",
      action: () => {
        // In a real app, this would open location settings
        alert("Location settings would open here")
      },
      color: "text-red-500",
    },
    {
      icon: Video,
      label: "Video Calls",
      description: "Camera and microphone settings",
      action: () => {
        // In a real app, this would open video call settings
        alert("Video call settings would open here")
      },
      color: "text-indigo-500",
    },
    {
      icon: Shield,
      label: "Safety Center",
      description: "Privacy, blocking, reporting",
      action: () => onNavigate("safety"),
      color: "text-orange-500",
    },
    {
      icon: Heart,
      label: "Discovery",
      description: "Distance, age range",
      action: () => onNavigate("discovery-filters"),
      color: "text-pink-500",
    },
    {
      icon: CreditCard,
      label: "Subscription",
      description: "Manage your plan",
      action: () => onNavigate("premium"),
      color: "text-yellow-500",
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      description: "FAQ, contact us",
      action: () => {
        // In a real app, this would open help center
        alert("Help center would open here")
      },
      color: "text-blue-500",
    },
  ]

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="flex items-center p-6 border-b">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("profile")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold ml-4">Settings</h1>
      </div>

      <div className="p-6 space-y-1">
        {settingsItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start h-auto p-4 text-left"
              onClick={item.action}
            >
              <Icon className={`w-5 h-5 mr-3 ${item.color}`} />
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-sm text-gray-500">{item.description}</div>
              </div>
            </Button>
          )
        })}
      </div>

      <div className="px-6 pt-6 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onNavigate("welcome")}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>

      {/* App Info */}
      <div className="px-6 pt-6 text-center text-gray-500 text-sm">
        <p>Spark Dating App v2.0</p>
        <p>Made with ❤️ by v0</p>
      </div>
    </div>
  )
}
