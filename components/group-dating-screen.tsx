"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EventsService, type GroupDate } from "@/lib/events-system"
import { Calendar, MapPin, Users, Plus, Heart, Clock } from "lucide-react"

interface GroupDatingScreenProps {
  userId: string
  onBack: () => void
  onCreateGroupDate: () => void
}

export default function GroupDatingScreen({ userId, onBack, onCreateGroupDate }: GroupDatingScreenProps) {
  const [groupDates, setGroupDates] = useState<GroupDate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGroupDates()
  }, [])

  const loadGroupDates = async () => {
    setLoading(true)
    try {
      const groupDatesData = await EventsService.getNearbyGroupDates(userId, "New York")
      setGroupDates(groupDatesData)
    } catch (error) {
      console.error("Load group dates error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroupDate = async (groupDateId: string) => {
    try {
      const result = await EventsService.joinGroupDate(userId, groupDateId)
      if (result.success) {
        alert("Successfully joined group date!")
        loadGroupDates() // Refresh group dates
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Join group date error:", error)
      alert("Failed to join group date")
    }
  }

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case "double_date":
        return "💕"
      case "group_hangout":
        return "👥"
      case "activity_group":
        return "🎯"
      case "dinner_group":
        return "🍽️"
      default:
        return "👫"
    }
  }

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case "double_date":
        return "bg-pink-100 text-pink-700"
      case "group_hangout":
        return "bg-blue-100 text-blue-700"
      case "activity_group":
        return "bg-green-100 text-green-700"
      case "dinner_group":
        return "bg-orange-100 text-orange-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold">Group Dating</h1>
          <Button onClick={onCreateGroupDate} size="sm" className="bg-pink-500 hover:bg-pink-600">
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        </div>
      </div>

      {/* Group Dates List */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading group dates...</p>
          </div>
        ) : groupDates.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No group dates yet</h3>
            <p className="text-gray-600 mb-4">Be the first to create a group date in your area!</p>
            <Button onClick={onCreateGroupDate} className="bg-pink-500 hover:bg-pink-600">
              Create Group Date
            </Button>
          </div>
        ) : (
          groupDates.map((groupDate) => (
            <div key={groupDate.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Group Date Image */}
              <div className="relative h-40">
                <img
                  src={groupDate.imageUrl || "/placeholder.svg"}
                  alt={groupDate.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge className={getGroupTypeColor(groupDate.type)}>
                    {getGroupTypeIcon(groupDate.type)} {groupDate.type.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* Group Date Details */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 flex-1">{groupDate.title}</h3>
                  <div className="text-right">
                    <div className="text-lg font-bold text-pink-600">${groupDate.cost}</div>
                    <div className="text-xs text-gray-500">{groupDate.splitType}</div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3">{groupDate.description}</p>

                {/* Group Date Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {groupDate.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {groupDate.time}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {groupDate.location.name}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {groupDate.currentParticipants}/{groupDate.maxParticipants} spots filled
                  </div>
                </div>

                {/* Organizer */}
                <div className="flex items-center mb-4">
                  <img
                    src={groupDate.organizer.photo || "/placeholder.svg"}
                    alt={groupDate.organizer.name}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <div>
                    <div className="text-sm font-medium">Organized by {groupDate.organizer.name}</div>
                  </div>
                </div>

                {/* Participants Preview */}
                <div className="flex items-center mb-4">
                  <div className="flex -space-x-2">
                    {groupDate.participants.slice(0, 3).map((participant) => (
                      <img
                        key={participant.id}
                        src={participant.photo || "/placeholder.svg"}
                        alt={participant.name}
                        className="w-8 h-8 rounded-full border-2 border-white"
                      />
                    ))}
                    {groupDate.participants.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                        +{groupDate.participants.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="ml-3 text-sm text-gray-600">
                    {groupDate.participants.length} participant{groupDate.participants.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Requirements */}
                {groupDate.requirements.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-1">Requirements:</h4>
                    <div className="flex flex-wrap gap-1">
                      {groupDate.requirements.map((req, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={() => handleJoinGroupDate(groupDate.id)}
                  className="w-full bg-pink-500 hover:bg-pink-600"
                  disabled={groupDate.currentParticipants >= groupDate.maxParticipants}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {groupDate.currentParticipants >= groupDate.maxParticipants ? "Group Full" : "Join Group Date"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
