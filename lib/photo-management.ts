import { supabase } from "./supabase"

export interface PhotoUpload {
  file: File
  preview: string
  id: string
  uploading?: boolean
  progress?: number
  error?: string
}

export interface PhotoMetadata {
  id: string
  url: string
  order: number
  isMain: boolean
  uploadedAt: Date
  size: number
  dimensions: { width: number; height: number }
  aiAnalysis?: {
    faceDetected: boolean
    quality: number
    appropriateContent: boolean
    tags: string[]
  }
}

export class PhotoManagementService {
  private static readonly MAX_PHOTOS = 6
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
  private static readonly COMPRESSION_QUALITY = 0.8

  static async uploadPhoto(
    file: File,
    userId: string,
    onProgress?: (progress: number) => void,
  ): Promise<PhotoMetadata> {
    try {
      // Validate file
      this.validateFile(file)

      // Compress image
      const compressedFile = await this.compressImage(file)

      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      if (!supabase) {
        // Mock upload for demo
        return {
          id: Date.now().toString(),
          url: "/placeholder.svg?height=600&width=400",
          order: 0,
          isMain: false,
          uploadedAt: new Date(),
          size: compressedFile.size,
          dimensions: { width: 400, height: 600 },
          aiAnalysis: {
            faceDetected: true,
            quality: 0.85,
            appropriateContent: true,
            tags: ["person", "portrait"],
          },
        }
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, compressedFile, {
          cacheControl: "3600",
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(fileName)

      // Get image dimensions
      const dimensions = await this.getImageDimensions(compressedFile)

      // Analyze image with AI
      const aiAnalysis = await this.analyzeImage(compressedFile)

      // Save metadata to database
      const photoMetadata: PhotoMetadata = {
        id: uploadData.path,
        url: publicUrl,
        order: 0,
        isMain: false,
        uploadedAt: new Date(),
        size: compressedFile.size,
        dimensions,
        aiAnalysis,
      }

      await this.savePhotoMetadata(userId, photoMetadata)

      return photoMetadata
    } catch (error) {
      console.error("Photo upload error:", error)
      throw error
    }
  }

  static async uploadMultiplePhotos(
    files: File[],
    userId: string,
    onProgress?: (fileIndex: number, progress: number) => void,
  ): Promise<PhotoMetadata[]> {
    const results: PhotoMetadata[] = []

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadPhoto(files[i], userId, (progress) => {
          onProgress?.(i, progress)
        })
        results.push(result)
      } catch (error) {
        console.error(`Failed to upload photo ${i}:`, error)
        // Continue with other photos
      }
    }

    return results
  }

  static async deletePhoto(userId: string, photoId: string): Promise<void> {
    try {
      if (!supabase) return

      // Delete from storage
      const { error: storageError } = await supabase.storage.from("photos").remove([photoId])

      if (storageError) throw storageError

      // Update user's photos array
      const { data: userData } = await supabase.from("users").select("photos").eq("id", userId).single()

      if (userData) {
        const updatedPhotos = userData.photos.filter((photo: string) => !photo.includes(photoId))
        await supabase.from("users").update({ photos: updatedPhotos }).eq("id", userId)
      }
    } catch (error) {
      console.error("Delete photo error:", error)
      throw error
    }
  }

  static async reorderPhotos(userId: string, photoOrder: string[]): Promise<void> {
    try {
      if (!supabase) return

      await supabase.from("users").update({ photos: photoOrder }).eq("id", userId)
    } catch (error) {
      console.error("Reorder photos error:", error)
      throw error
    }
  }

  static async setMainPhoto(userId: string, photoUrl: string): Promise<void> {
    try {
      if (!supabase) return

      const { data: userData } = await supabase.from("users").select("photos").eq("id", userId).single()

      if (userData) {
        const photos = [...userData.photos]
        const photoIndex = photos.indexOf(photoUrl)

        if (photoIndex > 0) {
          // Move photo to first position
          photos.splice(photoIndex, 1)
          photos.unshift(photoUrl)

          await supabase.from("users").update({ photos }).eq("id", userId)
        }
      }
    } catch (error) {
      console.error("Set main photo error:", error)
      throw error
    }
  }

  private static validateFile(file: File): void {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error("Invalid file type. Please upload JPEG, PNG, or WebP images.")
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error("File too large. Maximum size is 10MB.")
    }
  }

  private static async compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        const maxDimension = 1200
        let { width, height } = img

        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error("Failed to compress image"))
            }
          },
          file.type,
          this.COMPRESSION_QUALITY,
        )
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  private static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => reject(new Error("Failed to get image dimensions"))
      img.src = URL.createObjectURL(file)
    })
  }

  private static async analyzeImage(file: File): Promise<PhotoMetadata["aiAnalysis"]> {
    try {
      // In a real app, you would use AI services like:
      // - AWS Rekognition
      // - Google Vision API
      // - Azure Computer Vision
      // - Custom ML models

      // Mock AI analysis for demo
      const mockAnalysis = {
        faceDetected: Math.random() > 0.2, // 80% chance of face detection
        quality: Math.random() * 0.3 + 0.7, // Quality between 0.7-1.0
        appropriateContent: Math.random() > 0.05, // 95% appropriate content
        tags: this.generateMockTags(),
      }

      return mockAnalysis
    } catch (error) {
      console.error("Image analysis error:", error)
      return {
        faceDetected: false,
        quality: 0.5,
        appropriateContent: true,
        tags: [],
      }
    }
  }

  private static generateMockTags(): string[] {
    const possibleTags = [
      "person",
      "portrait",
      "outdoor",
      "indoor",
      "smile",
      "professional",
      "casual",
      "travel",
      "nature",
      "city",
      "beach",
      "mountain",
      "restaurant",
      "party",
      "sport",
      "hobby",
    ]

    const numTags = Math.floor(Math.random() * 4) + 1
    const shuffled = possibleTags.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, numTags)
  }

  private static async savePhotoMetadata(userId: string, metadata: PhotoMetadata): Promise<void> {
    try {
      if (!supabase) return

      // Get current photos
      const { data: userData } = await supabase.from("users").select("photos").eq("id", userId).single()

      const currentPhotos = userData?.photos || []
      const updatedPhotos = [...currentPhotos, metadata.url]

      // Limit to MAX_PHOTOS
      if (updatedPhotos.length > this.MAX_PHOTOS) {
        updatedPhotos.splice(0, updatedPhotos.length - this.MAX_PHOTOS)
      }

      await supabase.from("users").update({ photos: updatedPhotos }).eq("id", userId)
    } catch (error) {
      console.error("Save photo metadata error:", error)
      throw error
    }
  }

  static async getPhotoAnalytics(userId: string): Promise<{
    totalPhotos: number
    averageQuality: number
    faceDetectionRate: number
    mostCommonTags: string[]
  }> {
    // Mock analytics for demo
    return {
      totalPhotos: Math.floor(Math.random() * 6) + 1,
      averageQuality: Math.random() * 0.3 + 0.7,
      faceDetectionRate: Math.random() * 0.3 + 0.7,
      mostCommonTags: ["person", "portrait", "outdoor", "smile"],
    }
  }

  static createPhotoPreview(file: File): string {
    return URL.createObjectURL(file)
  }

  static revokePhotoPreview(url: string): void {
    URL.revokeObjectURL(url)
  }
}
