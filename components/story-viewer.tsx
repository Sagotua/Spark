"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, Heart, Flame, Smile, Laugh, Frown, MoreHorizontal } from "lucide-react"
import { StoriesService, type Story } from "@/lib/stories"

interface StoryViewerProps {
  stories: Story[]
  initialIndex: number
  currentUserId: string
  currentUserName: string
  currentUserPhoto: string
  onClose: () => void
}

export default function StoryViewer({
  stories,
  initialIndex,
  currentUserId,
  currentUserName,
  currentUserPhoto,
  onClose,
}: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const progressRef = useRef<NodeJS.Timeout>()
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentStory = stories[currentStoryIndex]
  const isVideo = currentStory?.mediaType === "video"
  const STORY_DURATION = 5000 // 5 seconds for photos, video duration for videos

  useEffect(() => {
    if (currentStory) {
      // Record view
      StoriesService.viewStory(currentStory.id, currentUserId, currentUserName, currentUserPhoto)
    }
  }, [currentStory, currentUserId, currentUserName, currentUserPhoto])

  useEffect(() => {
    if (!isPaused && currentStory) {
      const duration = isVideo ? (videoRef.current?.duration || 5) * 1000 : STORY_DURATION
      const interval = 50 // Update every 50ms

      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (interval / duration) * 100
          if (newProgress >= 100) {
            handleNextStory()
            return 0
          }
          return newProgress
        })
      }, interval)
    }

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current)
      }
    }
  }, [currentStoryIndex, isPaused, isVideo])

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1)
      setProgress(0)
    }
  }

  const handleReaction = async (reactionType: "heart" | "fire" | "wow" | "laugh" | "sad") => {
    if (currentStory) {
      await StoriesService.reactToStory(currentStory.id, currentUserId, currentUserName, currentUserPhoto, reactionType)
      setShowReactions(false)
    }
  }

  const reactionIcons = {
    heart: Heart,
    fire: Flame,
    wow: Smile,
    laugh: Laugh,
    sad: Frown,
  }

  if (!currentStory) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Progress Bars */}
      <div className="flex space-x-1 p-2">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: `${index < currentStoryIndex ? 100 : index === currentStoryIndex ? progress : 0}%`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center">
          <img
            src={currentStory.userPhoto || "/placeholder.svg"}
            alt={currentStory.userName}
            className="w-8 h-8 rounded-full mr-3"
          />
          <div>
            <p className="font-semibold">{currentStory.userName}</p>
            <p className="text-xs text-gray-300">
              {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Story Content */}
      <div
        className="flex-1 relative"
        onClick={() => setIsPaused(!isPaused)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Navigation Areas */}
        <div className="absolute inset-0 flex">
          <div className="w-1/3 h-full" onClick={handlePrevStory} />
          <div className="w-1/3 h-full" />
          <div className="w-1/3 h-full" onClick={handleNextStory} />
        </div>

        {isVideo ? (
          <video
            ref={videoRef}
            src={currentStory.mediaUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            onEnded={handleNextStory}
          />
        ) : (
          <img src={currentStory.mediaUrl || "/placeholder.svg"} alt="Story" className="w-full h-full object-cover" />
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-4 right-4">
            <p className="text-white text-center bg-black/50 rounded-lg px-4 py-2">{currentStory.caption}</p>
          </div>
        )}

        {/* Pause Indicator */}
        {isPaused && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-4">
              <div className="w-8 h-8 flex items-center justify-center">
                <div className="w-1 h-6 bg-white mr-1" />
                <div className="w-1 h-6 bg-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 flex items-center justify-between text-white">
        <Button variant="ghost" size="icon" onClick={() => setShowReactions(!showReactions)} className="text-white">
          <Heart className="w-6 h-6" />
        </Button>

        <Button variant="ghost" size="icon" className="text-white">
          <MoreHorizontal className="w-6 h-6" />
        </Button>
      </div>

      {/* Reaction Picker */}
      {showReactions && (
        <div className="absolute bottom-16 left-4 right-4 bg-black/80 rounded-full p-2 flex justify-center space-x-4">
          {Object.entries(reactionIcons).map(([type, Icon]) => (
            <Button
              key={type}
              variant="ghost"
              size="icon"
              onClick={() => handleReaction(type as any)}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <Icon className="w-6 h-6" />
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
