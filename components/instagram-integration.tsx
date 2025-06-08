"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SocialIntegrationsService, type InstagramProfile, type InstagramPhoto } from "@/lib/social-integrations"
import { Instagram, Check, Download, Heart, Play } from "lucide-react"

interface InstagramIntegrationProps {
  userId: string
  onPhotosSelected: (photos: string[]) => void
  onBack: () => void
}

export default function InstagramIntegration({ userId, onPhotosSelected, onBack }: InstagramIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<InstagramProfile | null>(null)
  const [photos, setPhotos] = useState<InstagramPhoto[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])

  useEffect(() => {
    loadInstagramData()
  }, [userId])

  const loadInstagramData = async () => {
    try {
      const data = await SocialIntegrationsService.getInstagramData(userId)
      if (data.profile) {
        setProfile(data.profile)
        setPhotos(data.photos)
        setIsConnected(true)
      }
    } catch (error) {
      console.error("Load Instagram data error:", error)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    try {
      const result = await SocialIntegrationsService.connectInstagram(userId)

      if (result.success && result.authUrl) {
        // In a real app, this would redirect to Instagram OAuth
        // For demo, simulate successful connection
        setTimeout(async () => {
          // Simulate getting access token and fetching data
          const mockProfile = await SocialIntegrationsService.getInstagramProfile("mock_token")
          const mockPhotos = await SocialIntegrationsService.getInstagramPhotos("mock_token")

          if (mockProfile) {
            setProfile(mockProfile)
            setPhotos(mockPhotos)
            setIsConnected(true)

            // Save to database
            await SocialIntegrationsService.saveInstagramData(userId, mockProfile, mockPhotos)
          }
          setLoading(false)
        }, 2000)
      } else {
        alert(result.error || "Failed to connect to Instagram")
        setLoading(false)
      }
    } catch (error) {
      console.error("Instagram connection error:", error)
      alert("Failed to connect to Instagram. Please try again.")
      setLoading(false)
    }
  }

  const handlePhotoSelect = (photoUrl: string) => {
    setSelectedPhotos((prev) => {
      if (prev.includes(photoUrl)) {
        return prev.filter((url) => url !== photoUrl)
      } else if (prev.length < 6) {
        return [...prev, photoUrl]
      } else {
        alert("You can select up to 6 photos")
        return prev
      }
    })
  }

  const handleImportPhotos = () => {
    if (selectedPhotos.length === 0) {
      alert("Please select at least one photo to import")
      return
    }
    onPhotosSelected(selectedPhotos)
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={onBack}>
              ← Back
            </Button>
            <h1 className="text-xl font-bold">Connect Instagram</h1>
            <div></div>
          </div>

          {/* Connection Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Instagram className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-xl font-bold mb-2">Connect Your Instagram</h2>
            <p className="text-gray-600 mb-6">
              Import your best photos and show your authentic self. This helps verify your identity and makes your
              profile more trustworthy.
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Verify your identity
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Import your best photos
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Show your authentic lifestyle
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Increase profile trust
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? "Connecting..." : "Connect Instagram"}
            </Button>

            <p className="text-xs text-gray-500 mt-4">We'll never post anything without your permission</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold">Import Photos</h1>
          <Button
            onClick={handleImportPhotos}
            disabled={selectedPhotos.length === 0}
            className="bg-pink-500 hover:bg-pink-600"
          >
            Import ({selectedPhotos.length})
          </Button>
        </div>

        {/* Profile Info */}
        {profile && (
          <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center">
              <img
                src={profile.profilePicture || "/placeholder.svg"}
                alt={profile.username}
                className="w-12 h-12 rounded-full mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-semibold">@{profile.username}</h3>
                  {profile.isVerified && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span>{profile.postCount} posts</span>
                  <span>{profile.followerCount.toLocaleString()} followers</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Selection */}
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Select photos to import (up to 6)</h3>
          <p className="text-sm text-gray-600 mb-4">Choose your best photos that represent you authentically</p>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => {
            const isSelected = selectedPhotos.includes(photo.url)

            return (
              <div
                key={photo.id}
                className="relative aspect-square cursor-pointer"
                onClick={() => handlePhotoSelect(photo.url)}
              >
                <img
                  src={photo.url || "/placeholder.svg"}
                  alt="Instagram photo"
                  className={`w-full h-full object-cover rounded-lg transition-all ${
                    isSelected ? "ring-2 ring-pink-500 opacity-75" : "hover:opacity-80"
                  }`}
                />

                {/* Video indicator */}
                {photo.isVideo && (
                  <div className="absolute top-2 right-2">
                    <Play className="w-4 h-4 text-white drop-shadow-lg" />
                  </div>
                )}

                {/* Like count */}
                <div className="absolute bottom-2 left-2 flex items-center text-white text-xs drop-shadow-lg">
                  <Heart className="w-3 h-3 mr-1" />
                  {photo.likeCount}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute inset-0 bg-pink-500 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}

                {/* Selection number */}
                {isSelected && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {selectedPhotos.indexOf(photo.url) + 1}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Import Button */}
        <div className="mt-6">
          <Button
            onClick={handleImportPhotos}
            disabled={selectedPhotos.length === 0}
            className="w-full bg-pink-500 hover:bg-pink-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Import {selectedPhotos.length} Photo{selectedPhotos.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </div>
  )
}
