"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Phone, MapPin, Clock, Shield, Users } from "lucide-react"

interface EmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string
}

interface EmergencyFeaturesProps {
  currentUser: any
  matchUser: any
  onClose: () => void
}

export default function EmergencyFeatures({ currentUser, matchUser, onClose }: EmergencyFeaturesProps) {
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { id: "1", name: "Sarah Johnson", phone: "+1-555-0123", relationship: "Best Friend" },
    { id: "2", name: "Mom", phone: "+1-555-0456", relationship: "Family" },
  ])
  const [isEmergencyActive, setIsEmergencyActive] = useState(false)
  const [checkInTimer, setCheckInTimer] = useState<number | null>(null)
  const [locationSharing, setLocationSharing] = useState(false)

  const handlePanicButton = () => {
    setIsEmergencyActive(true)
    // Simulate emergency alert
    emergencyContacts.forEach((contact) => {
      console.log(`🚨 EMERGENCY ALERT sent to ${contact.name} (${contact.phone})`)
    })

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        console.log(`📍 Location shared: ${position.coords.latitude}, ${position.coords.longitude}`)
      })
    }

    setTimeout(() => {
      setIsEmergencyActive(false)
    }, 5000)
  }

  const handleFakeCall = () => {
    // Simulate incoming call
    const audio = new Audio("/phone-ring.mp3")
    audio.play().catch(() => {
      // Fallback if audio doesn't work
      alert('📞 Incoming call from "Mom"...')
    })
  }

  const startCheckIn = (minutes: number) => {
    setCheckInTimer(minutes * 60) // Convert to seconds
  }

  const toggleLocationSharing = () => {
    setLocationSharing(!locationSharing)
    if (!locationSharing) {
      // Start location sharing
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition((position) => {
          console.log(`📍 Location update: ${position.coords.latitude}, ${position.coords.longitude}`)
        })
      }
    }
  }

  useEffect(() => {
    if (checkInTimer && checkInTimer > 0) {
      const interval = setInterval(() => {
        setCheckInTimer((prev) => {
          if (prev && prev <= 1) {
            // Timer expired - send check-in reminder
            console.log("⏰ Check-in reminder sent!")
            return null
          }
          return prev ? prev - 1 : null
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [checkInTimer])

  if (!onClose) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            Safety & Emergency Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Emergency Panic Button */}
          <div className="space-y-3">
            <h3 className="font-semibold text-red-600">Emergency Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handlePanicButton}
                disabled={isEmergencyActive}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {isEmergencyActive ? "Alert Sent!" : "Panic Button"}
              </Button>
              <Button onClick={handleFakeCall} variant="outline" className="border-orange-500 text-orange-600">
                <Phone className="h-4 w-4 mr-2" />
                Fake Call
              </Button>
            </div>
            {isEmergencyActive && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">🚨 Emergency alert sent to your contacts with your location!</p>
              </div>
            )}
          </div>

          {/* Check-in Timer */}
          <div className="space-y-3">
            <h3 className="font-semibold">Safety Check-in</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => startCheckIn(30)} variant="outline" size="sm">
                30min
              </Button>
              <Button onClick={() => startCheckIn(60)} variant="outline" size="sm">
                1hr
              </Button>
              <Button onClick={() => startCheckIn(120)} variant="outline" size="sm">
                2hr
              </Button>
            </div>
            {checkInTimer && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800 text-sm">
                    Check-in reminder in: {Math.floor(checkInTimer / 60)}:
                    {(checkInTimer % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Location Sharing */}
          <div className="space-y-3">
            <h3 className="font-semibold">Location Sharing</h3>
            <Button
              onClick={toggleLocationSharing}
              variant={locationSharing ? "default" : "outline"}
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              {locationSharing ? "Stop Sharing Location" : "Share Live Location"}
            </Button>
            {locationSharing && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-800 text-sm">📍 Your location is being shared with emergency contacts</p>
              </div>
            )}
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-3">
            <h3 className="font-semibold">Emergency Contacts</h3>
            <div className="space-y-2">
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-600">{contact.relationship}</p>
                  </div>
                  <Badge variant="outline">{contact.phone}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Tips */}
          <div className="space-y-3">
            <h3 className="font-semibold">Quick Safety Tips</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Meet in public places for first dates</li>
                <li>• Tell someone where you're going</li>
                <li>• Trust your instincts</li>
                <li>• Have your own transportation</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
            <Button className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Manage Contacts
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
