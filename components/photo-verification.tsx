"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, CheckCircle, X, RotateCcw } from "lucide-react"
import { AuthService } from "@/lib/auth"

interface PhotoVerificationProps {
  userId: string
  onVerificationComplete: (isVerified: boolean) => void
}

export default function PhotoVerification({ userId, onVerificationComplete }: PhotoVerificationProps) {
  const [step, setStep] = useState<"instructions" | "capture" | "processing" | "result">("instructions")
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<"verified" | "rejected" | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
      setStep("capture")
    } catch (error) {
      console.error("Camera access error:", error)
      alert("Unable to access camera. Please check permissions.")
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        context.drawImage(video, 0, 0)
        const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedPhoto(photoDataUrl)

        // Stop camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
        }

        processVerification(photoDataUrl)
      }
    }
  }

  const processVerification = async (photoDataUrl: string) => {
    setStep("processing")
    setIsProcessing(true)

    try {
      // Convert data URL to blob
      const response = await fetch(photoDataUrl)
      const blob = await response.blob()

      // Create form data
      const formData = new FormData()
      formData.append("photo", blob, "verification.jpg")
      formData.append("userId", userId)

      // Send to verification API
      const verificationResponse = await fetch("/api/verify-photo", {
        method: "POST",
        body: formData,
      })

      const result = await verificationResponse.json()

      if (result.success) {
        setVerificationResult("verified")
        // Update user verification status
        await AuthService.updateProfile(userId, { is_verified: true })
        onVerificationComplete(true)
      } else {
        setVerificationResult("rejected")
        onVerificationComplete(false)
      }
    } catch (error) {
      console.error("Verification error:", error)
      setVerificationResult("rejected")
      onVerificationComplete(false)
    } finally {
      setIsProcessing(false)
      setStep("result")
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
    setVerificationResult(null)
    startCamera()
  }

  const resetVerification = () => {
    setCapturedPhoto(null)
    setVerificationResult(null)
    setStep("instructions")
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto">
        {step === "instructions" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-blue-500" />
            </div>

            <h1 className="text-2xl font-bold mb-4">Verify Your Photos</h1>
            <p className="text-gray-600 mb-8">
              Take a selfie to verify that your photos are really you. This helps create a safer community.
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mb-8">
              <h3 className="font-semibold mb-2">Tips for a good verification photo:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Look directly at the camera</li>
                <li>• Make sure your face is well-lit</li>
                <li>• Remove sunglasses or hats</li>
                <li>• Match the pose from your profile photos</li>
              </ul>
            </div>

            <Button onClick={startCamera} className="w-full bg-blue-500 hover:bg-blue-600">
              <Camera className="w-5 h-5 mr-2" />
              Start Verification
            </Button>
          </div>
        )}

        {step === "capture" && (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Take Your Verification Photo</h2>

            <div className="relative mb-6">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
                style={{ transform: "scaleX(-1)" }} // Mirror effect
              />
              <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-white rounded-full opacity-50"></div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button variant="outline" onClick={resetVerification} className="flex-1">
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
              <Button onClick={capturePhoto} className="flex-1 bg-blue-500 hover:bg-blue-600">
                <Camera className="w-5 h-5 mr-2" />
                Capture
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-bold mb-2">Processing Your Photo</h2>
            <p className="text-gray-600">This may take a few moments...</p>
          </div>
        )}

        {step === "result" && (
          <div className="text-center">
            {verificationResult === "verified" ? (
              <>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-4">Verification Successful!</h2>
                <p className="text-gray-600 mb-8">
                  Your photos have been verified. You'll now see a blue checkmark on your profile.
                </p>
                <Button onClick={() => window.history.back()} className="w-full bg-green-500 hover:bg-green-600">
                  Continue
                </Button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <X className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
                <p className="text-gray-600 mb-8">
                  We couldn't verify your photo. Please make sure your face is clearly visible and try again.
                </p>
                <div className="flex space-x-4">
                  <Button variant="outline" onClick={resetVerification} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={retakePhoto} className="flex-1 bg-blue-500 hover:bg-blue-600">
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Try Again
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
