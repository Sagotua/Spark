"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { StoriesService, type Story } from "@/lib/stories"
import { ActivityFeedService } from "@/lib/activity-feed"
import StoryCreator from "./story-creator"
import StoryViewer from "./story-viewer"
import type { User } from "@/lib/supabase"

interface StoriesRingProps {
  currentUser: User
  onActivityFeed: () => void
}

export default function StoriesRing({ currentUser, onActivityFeed }: StoriesRingProps) {
  const [stories, setStories] = useState<Story[]>([])
  const [userStories, setUserStories] = useState<Story[]>([])
  const [showCreator, setShowCreator] = useState(false)
  const [showViewer, setShowViewer] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [recentActivity, setRecentActivity] = useState(0)

  useEffect(() => {
    loadStories()
    loadRecentActivity()
  }, [])

  const loadStories = async () => {
    try {
      const [allStories, myStories] = await Promise.all([
        StoriesService.getActiveStories(),
        StoriesService.getUserStories(currentUser.id),
      ])
      setStories(allStories.filter((s) => s.userId !== currentUser.id))
      setUserStories(myStories)
    } catch (error) {
      console.error("Load stories error:", error)
    }
  }

  const loadRecentActivity = async () => {
    try {
      const recentViews = await ActivityFeedService.getRecentProfileViews(currentUser.id)
      const recentLikes = await ActivityFeedService.getRecentLikes(currentUser.id)
      setRecentActivity(recentViews.length + recentLikes.length)
    } catch (error) {
      console.error("Load recent activity error:", error)
    }
  }

  const handleStoryCreated = () => {
    loadStories()
  }

  const handleViewStory = (index: number) => {
    setViewerIndex(index)
    setShowViewer(true)
  }

  // Group stories by user
  const groupedStories = stories.reduce(
    (acc, story) => {
      if (!acc[story.userId]) {
        acc[story.userId] = []
      }
      acc[story.userId].push(story)
      return acc
    },
    {} as Record<string, Story[]>,
  )

  const storyUsers = Object.keys(groupedStories).map((userId) => ({
    userId,
    stories: groupedStories[userId],
    latestStory: groupedStories[userId][0],
  }))

  return (
    <>
      <div className="p-4 bg-white border-b">
        <div className="flex items-center space-x-4 overflow-x-auto">
          {/* Your Story */}
          <div className="flex flex-col items-center space-y-2 min-w-0">
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-full border-2 ${
                  userStories.length > 0 ? "border-pink-500" : "border-gray-300"
                } p-1`}
              >
                <img
                  src={currentUser.photos[0] || "/placeholder.svg"}
                  alt="Your story"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              {userStories.length === 0 && (
                <Button
                  size="icon"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-pink-500 hover:bg-pink-600"
                  onClick={() => setShowCreator(true)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
            <span className="text-xs text-center">{userStories.length > 0 ? "Your Story" : "Add Story"}</span>
          </div>

          {/* Activity Feed */}
          <div className="flex flex-col items-center space-y-2 min-w-0">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-purple-500 p-1 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <div className="text-white text-xl font-bold">{recentActivity > 99 ? "99+" : recentActivity}</div>
              </div>
              {recentActivity > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
            </div>
            <Button variant="ghost" className="text-xs p-0 h-auto" onClick={onActivityFeed}>
              Activity
            </Button>
          </div>

          {/* Other Users' Stories */}
          {storyUsers.map((user, index) => (
            <div key={user.userId} className="flex flex-col items-center space-y-2 min-w-0">
              <div
                className="w-16 h-16 rounded-full border-2 border-pink-500 p-1 cursor-pointer"
                onClick={() => handleViewStory(index)}
              >
                <img
                  src={user.latestStory.userPhoto || "/placeholder.svg"}
                  alt={user.latestStory.userName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="text-xs text-center truncate w-16">{user.latestStory.userName}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Story Creator */}
      {showCreator && (
        <StoryCreator
          userId={currentUser.id}
          userName={currentUser.name}
          userPhoto={currentUser.photos[0]}
          onClose={() => setShowCreator(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}

      {/* Story Viewer */}
      {showViewer && storyUsers.length > 0 && (
        <StoryViewer
          stories={storyUsers[viewerIndex]?.stories || []}
          initialIndex={0}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          currentUserPhoto={currentUser.photos[0]}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  )
}
