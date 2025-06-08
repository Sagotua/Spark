"use client"

import { useState, useEffect } from "react"
import { AdvancedMatchingService } from "@/lib/advanced-matching"
import { DiscoveryFilterService, type DiscoveryFilters } from "@/lib/discovery-filters"
import { GeolocationService, type LocationData } from "@/lib/geolocation"
import { PushNotificationService } from "@/lib/push-notifications"
import { GamificationService } from "@/lib/gamification-system"
import { mockUsers } from "@/lib/supabase"
import WelcomeScreen from "@/components/welcome-screen"
import LoginScreen from "@/components/login-screen"
import RegisterScreen from "@/components/register-screen"
import ProfileSetupScreen from "@/components/profile-setup-screen"
import SwipeScreen from "@/components/swipe-screen"
import ChatListScreen from "@/components/chat-list-screen"
import EnhancedChatScreen from "@/components/enhanced-chat-screen"
import ProfileScreen from "@/components/profile-screen"
import SettingsScreen from "@/components/settings-screen"
import MatchModal from "@/components/match-modal"
import BottomNavigation from "@/components/bottom-navigation"
import PhotoVerification from "@/components/photo-verification"
import PremiumSubscription from "@/components/premium-subscription"
import SafetyCenter from "@/components/safety-center"
import PhotoManager from "@/components/photo-manager"
import DiscoveryFiltersScreen from "@/components/discovery-filters-screen"
import VideoCallScreen from "@/components/video-call-screen"
import NotificationSettings from "@/components/notification-settings"
import type { User } from "@/lib/supabase"
import StoriesRing from "@/components/stories-ring"
import ActivityFeedScreen from "@/components/activity-feed-screen"
import { ActivityFeedService } from "@/lib/activity-feed"
import AchievementsScreen from "@/components/achievements-screen"
import DailyChallenges from "@/components/daily-challenges"
import LeaderboardScreen from "@/components/leaderboard-screen"
import RewardsStore from "@/components/rewards-store"

export type Match = {
  id: string
  user: User
  timestamp: Date
}

export type Message = {
  id: string
  senderId: string
  text: string
  timestamp: Date
}

export type Chat = {
  id: string
  match: Match
  messages: Message[]
  lastMessage?: Message
}

export default function TinderApp() {
  const [currentScreen, setCurrentScreen] = useState<string>("welcome")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [showMatchModal, setShowMatchModal] = useState<Match | null>(null)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [compatibleUsers, setCompatibleUsers] = useState<User[]>([])
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null)
  const [discoveryFilters, setDiscoveryFilters] = useState<DiscoveryFilters>(DiscoveryFilterService.getDefaultFilters())
  const [activeCall, setActiveCall] = useState<{
    matchId: string
    otherUser: User
    isInitiator: boolean
  } | null>(null)
  const [userStats, setUserStats] = useState<any>(null)

  useEffect(() => {
    // Initialize services
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      // Initialize push notifications
      await PushNotificationService.initialize()

      // Request location permission
      const locationPermission = await GeolocationService.requestPermission()
      if (locationPermission.granted) {
        try {
          const location = await GeolocationService.getCurrentLocation()
          setCurrentLocation(location)

          // Start location tracking for better matching
          GeolocationService.startLocationTracking()
        } catch (error) {
          console.warn("Location access denied or failed:", error)
        }
      }
    } catch (error) {
      console.error("App initialization error:", error)
    }
  }

  const handleLogin = async (userData: User) => {
    setCurrentUser(userData)

    // Initialize gamification for user
    await GamificationService.initializeUser(userData.id)
    const stats = await GamificationService.getUserStats(userData.id)
    setUserStats(stats)

    // Update user location if available
    if (currentLocation) {
      await GeolocationService.updateUserLocation(userData.id, currentLocation)
    }

    // Load user's discovery filters
    const filters = await DiscoveryFilterService.loadFilters(userData.id)
    setDiscoveryFilters(filters)

    // Request notification permission
    const permission = await PushNotificationService.requestPermission()
    if (permission.granted) {
      await PushNotificationService.subscribe(userData.id)
    }

    setCurrentScreen("swipe")
  }

  const handleMatch = async (user: User) => {
    const newMatch: Match = {
      id: Date.now().toString(),
      user,
      timestamp: new Date(),
    }
    setMatches((prev) => [...prev, newMatch])
    setShowMatchModal(newMatch)

    // Record swipe for ML algorithm
    if (currentUser) {
      await AdvancedMatchingService.recordSwipeForML(currentUser.id, user, true)

      // Record activity
      await ActivityFeedService.recordActivity({
        type: "match",
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorPhoto: currentUser.photos[0] || "/placeholder.svg",
        targetId: user.id,
      })

      // Award points for match
      await GamificationService.awardPoints(currentUser.id, "match", 50)

      // Update user stats
      const updatedStats = await GamificationService.getUserStats(currentUser.id)
      setUserStats(updatedStats)
    }

    // Send match notification
    await PushNotificationService.sendMatchNotification({
      name: user.name,
      photo: user.photos[0] || "/placeholder.svg",
    })

    // Create a new chat
    const newChat: Chat = {
      id: Date.now().toString(),
      match: newMatch,
      messages: [],
    }
    setChats((prev) => [...prev, newChat])
  }

  const handleSendMessage = async (chatId: string, text: string) => {
    if (!currentUser) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text,
      timestamp: new Date(),
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, newMessage], lastMessage: newMessage } : chat,
      ),
    )

    // Award points for sending message
    await GamificationService.awardPoints(currentUser.id, "message", 10)

    // Update user stats
    const updatedStats = await GamificationService.getUserStats(currentUser.id)
    setUserStats(updatedStats)
  }

  const handlePhotosUpdate = (photos: string[]) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, photos })
    }
  }

  const handleFiltersApplied = (filters: DiscoveryFilters) => {
    setDiscoveryFilters(filters)
    loadCompatibleUsers(filters)
  }

  const handleStartVideoCall = (chat: Chat) => {
    setActiveCall({
      matchId: chat.id,
      otherUser: chat.match.user,
      isInitiator: true,
    })
    setCurrentScreen("video-call")
  }

  const handleEndVideoCall = () => {
    setActiveCall(null)
    setCurrentScreen("chats")
  }

  const loadCompatibleUsers = async (filters?: DiscoveryFilters) => {
    if (!currentUser) return

    try {
      // Initialize advanced matching
      await AdvancedMatchingService.initializeMatchingData()

      const filtersToUse = filters || discoveryFilters
      const userLocation = currentLocation || currentUser.location

      const users = await AdvancedMatchingService.getAdvancedMatches(
        currentUser.id,
        {
          ageRange: filtersToUse.ageRange,
          maxDistance: filtersToUse.maxDistance,
          genderPreference: filtersToUse.genderPreference,
          dealBreakers: filtersToUse.dealBreakers,
          mustHaves: filtersToUse.mustHaves,
        },
        20,
      )

      // Apply additional filtering
      const filteredUsers = await DiscoveryFilterService.getFilteredUsers(
        currentUser.id,
        filtersToUse,
        { lat: userLocation.lat, lng: userLocation.lng },
        20,
      )

      setCompatibleUsers(filteredUsers)
    } catch (error) {
      console.error("Load compatible users error:", error)
      // Fallback to mock users
      setCompatibleUsers(mockUsers.filter((u) => u.id !== currentUser.id))
    }
  }

  useEffect(() => {
    if (currentUser && currentScreen === "swipe") {
      loadCompatibleUsers()
    }
  }, [currentUser, currentScreen, currentLocation])

  const renderScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return <WelcomeScreen onNavigate={setCurrentScreen} />
      case "login":
        return <LoginScreen onLogin={handleLogin} onNavigate={setCurrentScreen} />
      case "register":
        return <RegisterScreen onRegister={handleLogin} onNavigate={setCurrentScreen} />
      case "profile-setup":
        return <ProfileSetupScreen onComplete={handleLogin} onNavigate={setCurrentScreen} />
      case "swipe":
        return (
          <div>
            <StoriesRing currentUser={currentUser!} onActivityFeed={() => setCurrentScreen("activity-feed")} />
            {userStats && <DailyChallenges userId={currentUser!.id} userStats={userStats} />}
            <SwipeScreen users={compatibleUsers} onMatch={handleMatch} />
          </div>
        )
      case "chats":
        return (
          <ChatListScreen
            chats={chats}
            onSelectChat={(chat) => {
              setSelectedChat(chat)
              setCurrentScreen("chat")
            }}
          />
        )
      case "chat":
        return selectedChat ? (
          <EnhancedChatScreen
            chat={selectedChat}
            currentUser={currentUser!}
            onBack={() => setCurrentScreen("chats")}
            onSendMessage={handleSendMessage}
          />
        ) : null
      case "profile":
        return <ProfileScreen user={currentUser!} onNavigate={setCurrentScreen} userStats={userStats} />
      case "settings":
        return <SettingsScreen onNavigate={setCurrentScreen} />
      case "photo-verification":
        return currentUser ? (
          <PhotoVerification
            userId={currentUser.id}
            onVerificationComplete={(verified) => {
              if (verified) {
                setCurrentUser((prev) => (prev ? { ...prev, is_verified: true } : null))
              }
              setCurrentScreen("profile")
            }}
          />
        ) : null
      case "premium":
        return (
          <PremiumSubscription
            currentPlan={currentUser?.is_premium ? "premium" : "free"}
            onBack={() => setCurrentScreen("profile")}
          />
        )
      case "safety":
        return <SafetyCenter onBack={() => setCurrentScreen("settings")} />
      case "photo-manager":
        return currentUser ? (
          <PhotoManager
            userId={currentUser.id}
            currentPhotos={currentUser.photos}
            onPhotosUpdate={handlePhotosUpdate}
            onBack={() => setCurrentScreen("profile")}
          />
        ) : null
      case "discovery-filters":
        return currentUser ? (
          <DiscoveryFiltersScreen
            userId={currentUser.id}
            onBack={() => setCurrentScreen("settings")}
            onFiltersApplied={handleFiltersApplied}
          />
        ) : null
      case "notification-settings":
        return currentUser ? (
          <NotificationSettings userId={currentUser.id} onBack={() => setCurrentScreen("settings")} />
        ) : null
      case "video-call":
        return activeCall && currentUser ? (
          <VideoCallScreen
            matchId={activeCall.matchId}
            currentUser={{
              id: currentUser.id,
              name: currentUser.name,
              photo: currentUser.photos[0] || "/placeholder.svg",
            }}
            otherUser={{
              id: activeCall.otherUser.id,
              name: activeCall.otherUser.name,
              photo: activeCall.otherUser.photos[0] || "/placeholder.svg",
            }}
            isInitiator={activeCall.isInitiator}
            onEndCall={handleEndVideoCall}
          />
        ) : null
      case "activity-feed":
        return currentUser ? (
          <ActivityFeedScreen userId={currentUser.id} onBack={() => setCurrentScreen("swipe")} />
        ) : null
      case "achievements":
        return currentUser ? (
          <AchievementsScreen userId={currentUser.id} onBack={() => setCurrentScreen("profile")} />
        ) : null
      case "leaderboard":
        return currentUser ? (
          <LeaderboardScreen userId={currentUser.id} onBack={() => setCurrentScreen("profile")} />
        ) : null
      case "rewards":
        return currentUser ? (
          <RewardsStore userId={currentUser.id} userStats={userStats} onBack={() => setCurrentScreen("profile")} />
        ) : null
      default:
        return <WelcomeScreen onNavigate={setCurrentScreen} />
    }
  }

  const showBottomNav = ["swipe", "chats", "profile", "settings"].includes(currentScreen)

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative">
      {renderScreen()}

      {showBottomNav && (
        <BottomNavigation
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          unreadChats={chats.filter((chat) => chat.lastMessage && chat.lastMessage.senderId !== currentUser?.id).length}
        />
      )}

      {showMatchModal && (
        <MatchModal
          match={showMatchModal}
          onClose={() => setShowMatchModal(null)}
          onSendMessage={() => {
            setShowMatchModal(null)
            setCurrentScreen("chats")
          }}
        />
      )}
    </div>
  )
}
