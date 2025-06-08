"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Video, X, Send, Type } from "lucide-react"
import { StoriesService } from "@/lib/stories"

interface StoryCreatorProps {
  userId: string
  userName: string
  userPhoto: string
  onClose: () => void
  onStoryCreated: () => void
}

export default function StoryCreator({ userId, userName, userPhoto, onClose, onStoryCreated }: StoryCreatorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
    }
  }

  const handleCreateStory = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      await StoriesService.createStory(userId, userName, userPhoto, selectedFile, caption)
      onStoryCreated()
      onClose()
    } catch (error) {
      console.error("Create story error:", error)
      alert("Failed to create story. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const isVideo = selectedFile?.type.startsWith("video/")

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
          <X className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-semibold">Create Story</h1>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {preview ? (
          <div className="flex-1 relative">
            {isVideo ? (
              <video ref={videoRef} src={preview} className="w-full h-full object-cover" controls autoPlay muted loop />
            ) : (
              <img src={preview || "/placeholder.svg"} alt="Story preview" className="w-full h-full object-cover" />
            )}

            {/* Caption Input */}
            <div className="absolute bottom-20 left-4 right-4">
              <div className="flex items-center bg-black/50 rounded-full px-4 py-2">
                <Type className="w-5 h-5 text-white mr-2" />
                <input
                  type="text"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-gray-300 outline-none"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Share Button */}
            <div className="absolute bottom-4 right-4">
              <Button
                onClick={handleCreateStory}
                disabled={isUploading}
                className="bg-pink-500 hover:bg-pink-600 text-white rounded-full w-12 h-12 p-0"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Share Your Moment</h2>
              <p className="text-gray-300">Choose a photo or video to share with your matches</p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-black hover:bg-gray-100 w-48 h-12"
              >
                <Camera className="w-5 h-5 mr-2" />
                Choose Photo
              </Button>

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black w-48 h-12"
              >
                <Video className="w-5 h-5 mr-2" />
                Choose Video
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  )
}
