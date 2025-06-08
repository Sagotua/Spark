"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Send, X, Play, Pause } from "lucide-react"

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number, waveform: number[]) => void
  onCancel: () => void
  recipientName: string
}

export default function VoiceRecorder({ onSend, onCancel, recipientName }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [waveform, setWaveform] = useState<number[]>([])
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setDuration(0)

      // Start duration timer
      intervalRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 0.1
          if (newDuration >= 30) {
            // 30 second limit for free users
            stopRecording()
            return 30
          }
          return newDuration
        })
      }, 100)

      // Start waveform animation
      animateWaveform()
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Unable to access microphone. Please check your permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }

  const animateWaveform = () => {
    // Generate random waveform data for visual effect
    const newWaveform = Array.from({ length: 50 }, () => Math.random() * 100)
    setWaveform(newWaveform)

    if (isRecording) {
      animationRef.current = requestAnimationFrame(animateWaveform)
    }
  }

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const handleSend = () => {
    if (audioBlob && duration > 0) {
      onSend(audioBlob, duration, waveform)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Send Voice Message</h3>
        <p className="text-gray-500 text-sm">Record a voice message for {recipientName}</p>
      </div>

      {/* Waveform Visualization */}
      <div className="bg-gray-100 rounded-lg p-4 mb-4 h-24 flex items-center justify-center">
        {waveform.length > 0 ? (
          <div className="flex items-end space-x-1 h-16">
            {waveform.map((height, index) => (
              <div
                key={index}
                className={`w-1 bg-pink-500 rounded-full transition-all duration-100 ${
                  isRecording ? "animate-pulse" : ""
                }`}
                style={{ height: `${Math.max(height * 0.6, 4)}px` }}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-center">
            <Mic className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Tap record to start</p>
          </div>
        )}
      </div>

      {/* Duration Display */}
      <div className="text-center mb-4">
        <span className="text-2xl font-mono font-bold text-gray-700">{formatDuration(duration)}</span>
        {duration >= 30 && <p className="text-xs text-red-500 mt-1">Maximum duration reached</p>}
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center space-x-4 mb-6">
        {!audioBlob ? (
          // Recording controls
          <>
            <Button variant="outline" size="icon" onClick={onCancel} className="w-12 h-12">
              <X className="w-6 h-6" />
            </Button>
            <Button
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-16 h-16 rounded-full ${
                isRecording ? "bg-red-500 hover:bg-red-600" : "bg-pink-500 hover:bg-pink-600"
              }`}
            >
              {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </Button>
            <div className="w-12 h-12" /> {/* Spacer */}
          </>
        ) : (
          // Playback controls
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setAudioBlob(null)
                setAudioUrl(null)
                setDuration(0)
                setWaveform([])
                setIsPlaying(false)
              }}
              className="w-12 h-12"
            >
              <X className="w-6 h-6" />
            </Button>

            <Button variant="outline" size="icon" onClick={playRecording} className="w-12 h-12">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>

            <Button size="icon" onClick={handleSend} className="w-12 h-12 bg-pink-500 hover:bg-pink-600">
              <Send className="w-6 h-6" />
            </Button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-xs text-gray-500">
        {!audioBlob ? (
          isRecording ? (
            <p>Recording... Tap the microphone to stop</p>
          ) : (
            <p>Tap the microphone to start recording</p>
          )
        ) : (
          <p>Tap play to preview, or send to {recipientName}</p>
        )}
      </div>

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} style={{ display: "none" }} />
      )}
    </div>
  )
}
