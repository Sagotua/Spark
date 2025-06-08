"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PhotoManagementService, type PhotoUpload } from "@/lib/photo-management"
import { Upload, X, Star, Trash2, ArrowLeft, Camera, ImageIcon } from "lucide-react"

interface PhotoManagerProps {
  userId: string
  currentPhotos: string[]
  onPhotosUpdate: (photos: string[]) => void
  onBack: () => void
}

export default function PhotoManager({ userId, currentPhotos, onPhotosUpdate, onBack }: PhotoManagerProps) {
  const [photos, setPhotos] = useState<PhotoUpload[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter((file) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        alert(`${file.name} is not a valid image format`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Create preview objects
    const newPhotos: PhotoUpload[] = validFiles.map((file) => ({
      file,
      preview: PhotoManagementService.createPhotoPreview(file),
      id: Date.now().toString() + Math.random(),
      uploading: false,
    }))

    setPhotos((prev) => [...prev, ...newPhotos])
  }, [])

  const handleUpload = async () => {
    if (photos.length === 0) return

    setUploading(true)

    try {
      const uploadPromises = photos.map(async (photo, index) => {
        setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, uploading: true, progress: 0 } : p)))

        try {
          const result = await PhotoManagementService.uploadPhoto(photo.file, userId, (progress) => {
            setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, progress } : p)))
          })

          setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, uploading: false, progress: 100 } : p)))

          return result.url
        } catch (error) {
          setPhotos((prev) =>
            prev.map((p) => (p.id === photo.id ? { ...p, uploading: false, error: "Upload failed" } : p)),
          )
          throw error
        }
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      const newPhotoUrls = [...currentPhotos, ...uploadedUrls]

      onPhotosUpdate(newPhotoUrls)

      // Clean up previews
      photos.forEach((photo) => {
        PhotoManagementService.revokePhotoPreview(photo.preview)
      })

      setPhotos([])
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === photoId)
      if (photo) {
        PhotoManagementService.revokePhotoPreview(photo.preview)
      }
      return prev.filter((p) => p.id !== photoId)
    })
  }

  const removeExistingPhoto = async (photoUrl: string) => {
    try {
      const photoId = photoUrl.split("/").pop()?.split("?")[0] || ""
      await PhotoManagementService.deletePhoto(userId, photoId)

      const updatedPhotos = currentPhotos.filter((url) => url !== photoUrl)
      onPhotosUpdate(updatedPhotos)
    } catch (error) {
      console.error("Delete photo error:", error)
      alert("Failed to delete photo")
    }
  }

  const setAsMainPhoto = async (photoUrl: string) => {
    try {
      await PhotoManagementService.setMainPhoto(userId, photoUrl)

      const reorderedPhotos = [photoUrl, ...currentPhotos.filter((url) => url !== photoUrl)]
      onPhotosUpdate(reorderedPhotos)
    } catch (error) {
      console.error("Set main photo error:", error)
      alert("Failed to set main photo")
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold ml-4">Manage Photos</h1>
        </div>

        {/* Current Photos */}
        {currentPhotos.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Current Photos</h2>
            <div className="grid grid-cols-2 gap-4">
              {currentPhotos.map((photoUrl, index) => (
                <div key={photoUrl} className="relative group">
                  <img
                    src={photoUrl || "/placeholder.svg"}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Main
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                    {index !== 0 && (
                      <Button
                        size="sm"
                        onClick={() => setAsMainPhoto(photoUrl)}
                        className="bg-yellow-500 hover:bg-yellow-600"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => removeExistingPhoto(photoUrl)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Photos</h2>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? "border-pink-500 bg-pink-50" : "border-gray-300"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">Drop photos here or click to browse</p>
              <p className="text-sm text-gray-500 mb-4">JPEG, PNG, WebP up to 10MB each</p>
              <div className="flex space-x-4">
                <Button onClick={() => fileInputRef.current?.click()} className="bg-pink-500 hover:bg-pink-600">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // In a real app, this would open camera
                    alert("Camera feature would open here")
                  }}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Preview Photos */}
        {photos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Ready to Upload</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.preview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />

                  {photo.uploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm">{photo.progress || 0}%</p>
                      </div>
                    </div>
                  )}

                  {photo.error && (
                    <div className="absolute inset-0 bg-red-500/80 rounded-lg flex items-center justify-center">
                      <p className="text-white text-sm text-center">{photo.error}</p>
                    </div>
                  )}

                  {!photo.uploading && !photo.error && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => removePhoto(photo.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || photos.some((p) => p.uploading)}
              className="w-full bg-pink-500 hover:bg-pink-600"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading...
                </>
              ) : (
                `Upload ${photos.length} Photo${photos.length > 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Photo Tips</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Use high-quality, well-lit photos</li>
            <li>• Show your face clearly in your main photo</li>
            <li>• Include variety: close-ups, full body, activities</li>
            <li>• Avoid group photos as your main image</li>
            <li>• Smile and look approachable</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
