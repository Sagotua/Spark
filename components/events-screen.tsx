"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EventsService, type DatingEvent } from "@/lib/events-system"
import { Calendar, MapPin, Users, Clock, Filter, Star, Plus, Search, Ticket } from "lucide-react"

interface EventsScreenProps {
  userId: string
  onBack: () => void
  onCreateEvent: () => void
}

export default function EventsScreen({ userId, onBack, onCreateEvent }: EventsScreenProps) {
  const [events, setEvents] = useState<DatingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilters, setSelectedFilters] = useState({
    type: [] as string[],
    priceRange: [0, 100] as [number, number],
    city: "New York",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [selectedFilters])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const eventsData = await EventsService.getUpcomingEvents(userId, {
        city: selectedFilters.city,
        type: selectedFilters.type.length > 0 ? selectedFilters.type : undefined,
        priceRange: selectedFilters.priceRange,
      })
      setEvents(eventsData)
    } catch (error) {
      console.error("Load events error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId: string) => {
    try {
      const result = await EventsService.registerForEvent(userId, eventId)
      if (result.success) {
        alert("Successfully registered for event!")
        loadEvents() // Refresh events
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Register for event error:", error)
      alert("Failed to register for event")
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "speed_dating":
        return "💕"
      case "mixer":
        return "🍸"
      case "activity":
        return "🎯"
      case "workshop":
        return "📚"
      case "party":
        return "🎉"
      case "outdoor":
        return "🌲"
      case "cultural":
        return "🎭"
      case "sports":
        return "⚽"
      default:
        return "📅"
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "speed_dating":
        return "bg-pink-100 text-pink-700"
      case "mixer":
        return "bg-purple-100 text-purple-700"
      case "activity":
        return "bg-blue-100 text-blue-700"
      case "workshop":
        return "bg-green-100 text-green-700"
      case "party":
        return "bg-yellow-100 text-yellow-700"
      case "outdoor":
        return "bg-emerald-100 text-emerald-700"
      case "cultural":
        return "bg-indigo-100 text-indigo-700"
      case "sports":
        return "bg-orange-100 text-orange-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold">Dating Events</h1>
          <Button onClick={onCreateEvent} size="sm" className="bg-pink-500 hover:bg-pink-600">
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="px-4 pb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
            </Button>

            {selectedFilters.type.length > 0 && (
              <Badge variant="secondary">{selectedFilters.type.length} type filters</Badge>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <h3 className="font-medium mb-2">Event Types</h3>
                <div className="flex flex-wrap gap-2">
                  {["speed_dating", "mixer", "activity", "outdoor", "cultural", "party"].map((type) => (
                    <Button
                      key={type}
                      variant={selectedFilters.type.includes(type) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedFilters((prev) => ({
                          ...prev,
                          type: prev.type.includes(type) ? prev.type.filter((t) => t !== type) : [...prev.type, type],
                        }))
                      }}
                      className="text-xs"
                    >
                      {getEventTypeIcon(type)} {type.replace("_", " ")}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Price Range</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">${selectedFilters.priceRange[0]}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedFilters.priceRange[1]}
                    onChange={(e) =>
                      setSelectedFilters((prev) => ({
                        ...prev,
                        priceRange: [prev.priceRange[0], Number.parseInt(e.target.value)],
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm">${selectedFilters.priceRange[1]}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
            <Button onClick={onCreateEvent} className="bg-pink-500 hover:bg-pink-600">
              Create Your Own Event
            </Button>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Event Image */}
              <div className="relative h-48">
                <img
                  src={event.imageUrl || "/placeholder.svg"}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge className={getEventTypeColor(event.type)}>
                    {getEventTypeIcon(event.type)} {event.type.replace("_", " ")}
                  </Badge>
                </div>
                {event.isPremiumOnly && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-yellow-100 text-yellow-700">
                      <Star className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 flex-1">{event.title}</h3>
                  <div className="text-right">
                    <div className="text-lg font-bold text-pink-600">${event.price}</div>
                    <div className="text-xs text-gray-500">per person</div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>

                {/* Event Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {event.date.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    {event.startTime} - {event.endTime}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location.name}, {event.location.city}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    {event.attendeeCount}/{event.capacity} attending
                  </div>
                </div>

                {/* Organizer */}
                <div className="flex items-center mb-4">
                  <img
                    src={event.organizer.photo || "/placeholder.svg"}
                    alt={event.organizer.name}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                  <div>
                    <div className="text-sm font-medium">{event.organizer.name}</div>
                    {event.organizer.isVerified && <div className="text-xs text-green-600">✓ Verified Organizer</div>}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {event.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {event.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{event.tags.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => handleRegister(event.id)}
                  className="w-full bg-pink-500 hover:bg-pink-600"
                  disabled={event.attendeeCount >= event.capacity}
                >
                  <Ticket className="w-4 h-4 mr-2" />
                  {event.attendeeCount >= event.capacity ? "Event Full" : `Register for $${event.price}`}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
