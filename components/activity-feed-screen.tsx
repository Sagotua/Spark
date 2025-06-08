"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, Heart, Star, MessageCircle } from "lucide-react"
import { ActivityFeedService, type ActivityItem } from "@/lib/activity-feed"

interface ActivityFeedScreenProps {
  userId: string
  onBack: () => void
}

export default function ActivityFeedScreen({ userId, onBack }: ActivityFeedScreenProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "views" | "likes" | "stories">("all")

  useEffect(() => {
    loadActivities()
  }, [userId])

  const loadActivities = async () => {
    try {
      const userActivities = await ActivityFeedService.getUserActivity(userId)
      setActivities(userActivities)
    } catch (error) {
      console.error("Load activities error:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter((activity) => {
    if (filter === "all") return true
    if (filter === "views") return activity.type === "profile_view"
    if (filter === "likes") return ["like", "super_like"].includes(activity.type)
    if (filter === "stories") return ["story_view", "story_reaction"].includes(activity.type)
    return true
  })

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "profile_view":
        return <Eye className="w-5 h-5 text-blue-500" />
      case "like":
        return <Heart className="w-5 h-5 text-pink-500" />
      case "super_like":
        return <Star className="w-5 h-5 text-blue-500" />
      case "match":
        return <Heart className="w-5 h-5 text-green-500 fill-current" />
      case "story_view":
        return <Eye className="w-5 h-5 text-purple-500" />
      case "story_reaction":
        return <Heart className="w-5 h-5 text-red-500" />
      default:
        return <MessageCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case "profile_view":
        return "viewed your profile"
      case "like":
        return "liked you"
      case "super_like":
        return "super liked you!"
      case "match":
        return "matched with you!"
      case "story_view":
        return "viewed your story"
      case "story_reaction":
        return `reacted ${activity.metadata?.reactionType || "❤️"} to your story`
      default:
        return "interacted with you"
    }
  }

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const summary = ActivityFeedService.getActivitySummary(activities)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your activity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="flex items-center p-6 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-bold ml-4">Activity</h1>
      </div>

      {/* Summary Stats */}
      <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50">
        <h2 className="text-lg font-semibold mb-4">Your Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-pink-500">{summary.recentViews}</div>
            <div className="text-sm text-gray-600">Profile views today</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">{summary.recentLikes}</div>
            <div className="text-sm text-gray-600">Likes today</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b">
        {[
          { key: "all", label: "All" },
          { key: "views", label: "Views" },
          { key: "likes", label: "Likes" },
          { key: "stories", label: "Stories" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant="ghost"
            className={`flex-1 rounded-none border-b-2 ${
              filter === tab.key ? "border-pink-500 text-pink-500" : "border-transparent"
            }`}
            onClick={() => setFilter(tab.key as any)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Activity List */}
      <div className="p-6">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No activity yet</h3>
            <p className="text-gray-500">Your activity will appear here when people interact with your profile.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <img
                  src={activity.actorPhoto || "/placeholder.svg"}
                  alt={activity.actorName}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    {getActivityIcon(activity.type)}
                    <span className="font-medium">{activity.actorName}</span>
                    <span className="text-gray-600">{getActivityText(activity)}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{getTimeAgo(activity.timestamp)}</div>
                </div>
                {activity.metadata?.isRecent && <div className="w-2 h-2 bg-pink-500 rounded-full" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
