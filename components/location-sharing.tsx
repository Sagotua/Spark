"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { MapPin, Clock, Users, X, AlertTriangle } from "lucide-react"
import type { User } from "@/lib/supabase"

interface LocationSharingProps {
  currentUser: User
  matchUser: User
  onClose: () => void
}

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
  isSelected: boolean
}

export default function LocationSharing({ currentUser, matchUser, onClose }: LocationSharingProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [duration, setDuration] = useState("60")
  const [remainingTime, setRemainingTime] = useState(0)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    {
      id: "1",
      name: "Mom",
      phone: "+1234567890",
      relationship: "Family",
      isSelected: true,
    },
    {
      id: "2",
      name: "Best Friend",
      phone: "+1987654321",
      relationship: "Friend",
      isSelected: true,
    },
    {
      id: "3",
      name: "Roommate",
      phone: "+1555123456",
      relationship: "Roommate",
      isSelected: false,
    },
  ])
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Simulate getting current location
    setTimeout(() => {
      setCurrentLocation({
        lat: 37.7749,
        lng: -122.4194,
      })
    }, 1000)
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isSharing && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime((prev) => Math.max(0, prev - 1))
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isSharing, remainingTime])

  const handleStartSharing = () => {
    setIsSharing(true)
    setRemainingTime(Number.parseInt(duration) * 60) // Convert minutes to seconds
  }

  const handleStopSharing = () => {
    setIsSharing(false)
    setRemainingTime(0)
  }

  const toggleContact = (id: string) => {
    setEmergencyContacts((prev) =>
      prev.map((contact) => (contact.id === id ? { ...contact, isSelected: !contact.isSelected } : contact)),
    )
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    return `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${remainingSeconds}s`
  }

  const selectedContacts = emergencyContacts.filter((contact) => contact.isSelected)

  return (
    <div className="bg-white rounded-t-2xl w-full max-w-md mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Location Sharing</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {isSharing ? (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="bg-green-100 rounded-full p-2 mr-3">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-800">Location sharing active</h3>
                <p className="text-sm text-green-600">
                  Your location is being shared with {selectedContacts.length} contact
                  {selectedContacts.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Clock className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="font-medium">Time remaining</h3>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-3xl font-bold text-center">{formatTime(remainingTime)}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <Users className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="font-medium">Sharing with</h3>
            </div>
            <div className="space-y-2">
              {selectedContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.relationship}</p>
                  </div>
                  <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Active</div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleStopSharing} variant="destructive" className="w-full">
            Stop Sharing Location
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-700">
                Share your location with trusted contacts when meeting {matchUser.name} for added safety.
              </p>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium mb-2 block">How long to share?</Label>
            <RadioGroup value={duration} onValueChange={setDuration} className="grid grid-cols-3 gap-2">
              <div>
                <RadioGroupItem value="30" id="r1" className="peer sr-only" />
                <Label
                  htmlFor="r1"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-pink-500 [&:has([data-state=checked])]:border-pink-500"
                >
                  <Clock className="mb-1 h-5 w-5" />
                  <span className="text-sm font-medium">30 min</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="60" id="r2" className="peer sr-only" />
                <Label
                  htmlFor="r2"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-pink-500 [&:has([data-state=checked])]:border-pink-500"
                >
                  <Clock className="mb-1 h-5 w-5" />
                  <span className="text-sm font-medium">1 hour</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="120" id="r3" className="peer sr-only" />
                <Label
                  htmlFor="r3"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-pink-500 [&:has([data-state=checked])]:border-pink-500"
                >
                  <Clock className="mb-1 h-5 w-5" />
                  <span className="text-sm font-medium">2 hours</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-medium mb-2 block">Share with these contacts</Label>
            <div className="space-y-3 mt-2">
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.relationship}</p>
                  </div>
                  <Switch checked={contact.isSelected} onCheckedChange={() => toggleContact(contact.id)} />
                </div>
              ))}
            </div>
            <Button variant="link" className="text-pink-500 p-0 h-auto mt-2">
              + Add new emergency contact
            </Button>
          </div>

          <Button
            onClick={handleStartSharing}
            className="w-full bg-pink-500 hover:bg-pink-600"
            disabled={!currentLocation || selectedContacts.length === 0}
          >
            {!currentLocation ? (
              "Getting your location..."
            ) : selectedContacts.length === 0 ? (
              "Select at least one contact"
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Start Sharing Location
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
