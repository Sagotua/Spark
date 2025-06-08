"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Video, VideoOff, Mic, MicOff, PhoneOff, MessageCircle, RotateCcw, Volume2, VolumeX } from "lucide-react"
import { VideoCallingService, type CallState, type CallParticipant } from "@/lib/video-calling"

interface VideoCallScreenProps {
  matchId: string
  currentUser: CallParticipant
  otherUser: CallParticipant
  isInitiator: boolean
  onEndCall: () => void
}

export default function VideoCallScreen({
  matchId,
  currentUser,
  otherUser,
  isInitiator,
  onEndCall,
}: VideoCallScreenProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [callState, setCallState] = useState<CallState>(VideoCallingService.getCallState())
  const [showControls, setShowControls] = useState(true)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)

  useEffect(() => {
    // Initialize call
    VideoCallingService.initializeCall(matchId, currentUser)

    // Listen for call state changes
    const unsubscribe = VideoCallingService.onStateChange(setCallState)

    // Auto-hide controls after 5 seconds
    const controlsTimer = setTimeout(() => {
      setShowControls(false)
    }, 5000)

    // Listen for incoming call events
    const handleIncomingCall = (event: CustomEvent) => {
      if (event.detail.matchId === matchId && !isInitiator) {
        VideoCallingService.answerCall(matchId, event.detail.offer)
      }
    }

    window.addEventListener("incomingCall", handleIncomingCall as EventListener)

    return () => {
      unsubscribe()
      clearTimeout(controlsTimer)
      window.removeEventListener("incomingCall", handleIncomingCall as EventListener)
    }
  }, [matchId, currentUser, isInitiator])

  useEffect(() => {
    // Update video elements when streams change
    if (localVideoRef.current && callState.participants[0]?.stream) {
      localVideoRef.current.srcObject = callState.participants[0].stream
    }

    if (remoteVideoRef.current && callState.participants[1]?.stream) {
      remoteVideoRef.current.srcObject = callState.participants[1].stream
    }
  }, [callState.participants])

  useEffect(() => {
    // Start call if initiator
    if (isInitiator && callState.status === "idle") {
      VideoCallingService.startCall(matchId, currentUser, otherUser)
    }
  }, [isInitiator, matchId, currentUser, otherUser, callState.status])

  const handleEndCall = () => {
    VideoCallingService.endCall()
    onEndCall()
  }

  const handleToggleVideo = () => {
    VideoCallingService.toggleVideo()
  }

  const handleToggleAudio = () => {
    VideoCallingService.toggleAudio()
  }

  const handleSwitchCamera = () => {
    VideoCallingService.switchCamera()
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    // In a real app, this would control audio output routing
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusMessage = () => {
    switch (callState.status) {
      case "calling":
        return "Calling..."
      case "ringing":
        return "Incoming call..."
      case "connected":
        return null
      case "ended":
        return callState.error || "Call ended"
      default:
        return "Connecting..."
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col" onClick={() => setShowControls(true)}>
      {/* Remote video (full screen) */}
      <div className="flex-1 relative">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

        {/* Status overlay */}
        {getStatusMessage() && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              {callState.status === "calling" || callState.status === "ringing" ? (
                <>
                  <img
                    src={otherUser.photo || "/placeholder.svg"}
                    alt={otherUser.name}
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white"
                  />
                  <h2 className="text-2xl font-bold mb-2">{otherUser.name}</h2>
                  <p className="text-lg">{getStatusMessage()}</p>
                  {callState.status === "calling" && (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
                  )}
                </>
              ) : (
                <p className="text-lg">{getStatusMessage()}</p>
              )}
            </div>
          </div>
        )}

        {/* Call duration */}
        {callState.status === "connected" && callState.duration > 0 && (
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full">
            {formatDuration(callState.duration)}
          </div>
        )}

        {/* Connection quality indicator */}
        {callState.status === "connected" && (
          <div className="absolute top-4 right-4 flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Local video (picture-in-picture) */}
      <div className="absolute top-4 right-4 w-32 h-48 bg-gray-900 rounded-lg overflow-hidden border-2 border-white">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }} // Mirror effect
        />
        {!callState.isVideoEnabled && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <VideoOff className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-4 bg-black/50 rounded-full px-6 py-4">
            {/* Toggle Video */}
            <Button
              onClick={handleToggleVideo}
              size="lg"
              className={`w-14 h-14 rounded-full ${
                callState.isVideoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {callState.isVideoEnabled ? (
                <Video className="w-6 h-6 text-white" />
              ) : (
                <VideoOff className="w-6 h-6 text-white" />
              )}
            </Button>

            {/* Toggle Audio */}
            <Button
              onClick={handleToggleAudio}
              size="lg"
              className={`w-14 h-14 rounded-full ${
                callState.isAudioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {callState.isAudioEnabled ? (
                <Mic className="w-6 h-6 text-white" />
              ) : (
                <MicOff className="w-6 h-6 text-white" />
              )}
            </Button>

            {/* End Call */}
            <Button onClick={handleEndCall} size="lg" className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600">
              <PhoneOff className="w-6 h-6 text-white" />
            </Button>

            {/* Switch Camera */}
            <Button
              onClick={handleSwitchCamera}
              size="lg"
              className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </Button>

            {/* Speaker Toggle */}
            <Button
              onClick={toggleSpeaker}
              size="lg"
              className={`w-14 h-14 rounded-full ${
                isSpeakerOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6 text-white" /> : <VolumeX className="w-6 h-6 text-white" />}
            </Button>

            {/* Chat */}
            <Button
              size="lg"
              className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600"
              onClick={() => {
                // Open chat overlay
                alert("Chat feature would open here")
              }}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </Button>
          </div>
        </div>
      )}

      {/* Incoming call actions */}
      {callState.status === "ringing" && !isInitiator && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-8">
          <Button
            onClick={() => VideoCallingService.rejectCall(matchId)}
            size="lg"
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="w-8 h-8 text-white" />
          </Button>
          <Button
            onClick={() => {
              // Answer call - this will be handled by the useEffect
            }}
            size="lg"
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
          >
            <Video className="w-8 h-8 text-white" />
          </Button>
        </div>
      )}
    </div>
  )
}
