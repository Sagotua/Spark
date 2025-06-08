"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Download } from "lucide-react"

interface VoicePlayerProps {
  audioUrl: string
  duration: number
  waveform?: number[]
  isOwn?: boolean
}

export default function VoicePlayer({ audioUrl, duration, waveform = [], isOwn = false }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.addEventListener("loadeddata", () => {
      setIsLoaded(true)
    })

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime)
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    audio.addEventListener("error", () => {
      console.error("Error loading audio")
      setIsLoaded(false)
    })

    return () => {
      audio.pause()
      audio.removeEventListener("loadeddata", () => {})
      audio.removeEventListener("timeupdate", () => {})
      audio.removeEventListener("ended", () => {})
      audio.removeEventListener("error", () => {})
    }
  }, [audioUrl])

  const togglePlayback = () => {
    if (!audioRef.current || !isLoaded) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = audioUrl
    link.download = `voice-message-${Date.now()}.webm`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={`flex items-center space-x-3 p-2 ${isOwn ? "text-white" : "text-gray-900"}`}>
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayback}
        disabled={!isLoaded}
        className={`w-8 h-8 rounded-full ${isOwn ? "hover:bg-pink-400 text-white" : "hover:bg-gray-200 text-gray-700"}`}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>

      {/* Waveform */}
      <div className="flex-1 flex items-center space-x-1 h-8">
        {waveform.length > 0 ? (
          waveform.map((height, index) => {
            const isActive = (index / waveform.length) * 100 <= progress
            return (
              <div
                key={index}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isActive ? (isOwn ? "bg-white" : "bg-pink-500") : isOwn ? "bg-pink-300" : "bg-gray-300"
                }`}
                style={{ height: `${Math.max(height * 0.3, 2)}px` }}
              />
            )
          })
        ) : (
          // Fallback progress bar if no waveform
          <div className={`flex-1 h-1 rounded-full ${isOwn ? "bg-pink-300" : "bg-gray-300"}`}>
            <div
              className={`h-full rounded-full transition-all duration-100 ${isOwn ? "bg-white" : "bg-pink-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Duration */}
      <span className={`text-xs font-mono ${isOwn ? "text-pink-100" : "text-gray-500"}`}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Download Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        className={`w-6 h-6 ${isOwn ? "hover:bg-pink-400 text-white" : "hover:bg-gray-200 text-gray-700"}`}
      >
        <Download className="w-3 h-3" />
      </Button>
    </div>
  )
}
