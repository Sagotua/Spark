"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Video, VideoOff, Mic, MicOff, PhoneOff, MessageCircle } from "lucide-react"

interface VideoCallProps {
  matchId: string
  isInitiator: boolean
  onEndCall: () => void
}

export default function VideoCall({ matchId, isInitiator, onEndCall }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [callDuration, setCallDuration] = useState(0)

  useEffect(() => {
    initializeCall()
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isConnected])

  const initializeCall = async () => {
    try {
      setIsConnecting(true)

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Create peer connection
      const configuration = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      }

      const peerConnection = new RTCPeerConnection(configuration)
      peerConnectionRef.current = peerConnection

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
          setIsConnected(true)
          setIsConnecting(false)
        }
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to remote peer via signaling server
          sendSignalingMessage({
            type: "ice-candidate",
            candidate: event.candidate,
            matchId,
          })
        }
      }

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log("Connection state:", peerConnection.connectionState)
        if (peerConnection.connectionState === "connected") {
          setIsConnected(true)
          setIsConnecting(false)
        } else if (peerConnection.connectionState === "disconnected" || peerConnection.connectionState === "failed") {
          setIsConnected(false)
          onEndCall()
        }
      }

      if (isInitiator) {
        // Create offer
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)

        sendSignalingMessage({
          type: "offer",
          offer,
          matchId,
        })
      }

      // Listen for signaling messages
      setupSignalingListener()
    } catch (error) {
      console.error("Failed to initialize call:", error)
      setIsConnecting(false)
      alert("Failed to access camera/microphone")
    }
  }

  const sendSignalingMessage = async (message: any) => {
    // In a real app, this would send via WebSocket or your signaling server
    // For demo purposes, we'll use Supabase realtime
    try {
      await fetch("/api/signaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      })
    } catch (error) {
      console.error("Failed to send signaling message:", error)
    }
  }

  const setupSignalingListener = () => {
    // Listen for signaling messages via WebSocket or Supabase realtime
    // This is a simplified version
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn
        setIsVideoOn(!isVideoOn)
      }
    }
  }

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn
        setIsAudioOn(!isAudioOn)
      }
    }
  }

  const endCall = () => {
    cleanup()
    onEndCall()
  }

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote video */}
      <div className="flex-1 relative">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              {isConnecting ? (
                <>
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg">Connecting...</p>
                </>
              ) : (
                <p className="text-lg">Waiting for connection...</p>
              )}
            </div>
          </div>
        )}

        {/* Call duration */}
        {isConnected && (
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full">
            {formatDuration(callDuration)}
          </div>
        )}
      </div>

      {/* Local video */}
      <div className="absolute top-4 right-4 w-32 h-48 bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
        <Button
          onClick={toggleVideo}
          size="lg"
          className={`w-14 h-14 rounded-full ${
            isVideoOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {isVideoOn ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
        </Button>

        <Button
          onClick={toggleAudio}
          size="lg"
          className={`w-14 h-14 rounded-full ${
            isAudioOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"
          }`}
        >
          {isAudioOn ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
        </Button>

        <Button onClick={endCall} size="lg" className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600">
          <PhoneOff className="w-6 h-6 text-white" />
        </Button>

        <Button size="lg" className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600">
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </div>
    </div>
  )
}
