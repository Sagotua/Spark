import { supabase } from "./supabase"

export interface DatingEvent {
  id: string
  title: string
  description: string
  type: "speed_dating" | "mixer" | "activity" | "workshop" | "party" | "outdoor" | "cultural" | "sports"
  imageUrl: string
  date: Date
  startTime: string
  endTime: string
  location: {
    name: string
    address: string
    city: string
    lat: number
    lng: number
  }
  capacity: number
  attendeeCount: number
  price: number
  isPremiumOnly: boolean
  ageRange: [number, number]
  genderRatio?: "mixed" | "balanced" | "any"
  organizer: {
    id: string
    name: string
    photo: string
    isVerified: boolean
  }
  tags: string[]
  requirements?: string[]
  whatToExpect: string[]
  isActive: boolean
  registrationDeadline: Date
  cancellationPolicy: string
}

export interface EventAttendee {
  id: string
  eventId: string
  userId: string
  userName: string
  userPhoto: string
  userAge: number
  registrationDate: Date
  status: "registered" | "confirmed" | "attended" | "no_show" | "cancelled"
  paymentStatus: "pending" | "paid" | "refunded"
  specialRequests?: string
}

export interface GroupDate {
  id: string
  title: string
  description: string
  type: "double_date" | "group_hangout" | "activity_group" | "dinner_group"
  imageUrl: string
  date: Date
  time: string
  location: {
    name: string
    address: string
    city: string
  }
  maxParticipants: number
  currentParticipants: number
  organizer: {
    id: string
    name: string
    photo: string
  }
  participants: Array<{
    id: string
    name: string
    photo: string
    role: "organizer" | "participant" | "plus_one"
  }>
  cost: number
  splitType: "equal" | "organizer_pays" | "individual"
  requirements: string[]
  isPrivate: boolean
  inviteCode?: string
}

export class EventsService {
  // Get upcoming events
  static async getUpcomingEvents(
    userId: string,
    filters: {
      city?: string
      type?: string[]
      priceRange?: [number, number]
      dateRange?: [Date, Date]
      ageRange?: [number, number]
    } = {},
  ): Promise<DatingEvent[]> {
    try {
      // Mock events for demo
      const mockEvents: DatingEvent[] = [
        {
          id: "event_1",
          title: "Speed Dating Night",
          description: "Meet 10+ singles in one fun evening! Professional speed dating with a modern twist.",
          type: "speed_dating",
          imageUrl: "/placeholder.svg?height=300&width=400&text=Speed+Dating",
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          startTime: "7:00 PM",
          endTime: "9:30 PM",
          location: {
            name: "The Rooftop Lounge",
            address: "123 Downtown Ave",
            city: "New York",
            lat: 40.7128,
            lng: -74.006,
          },
          capacity: 40,
          attendeeCount: 28,
          price: 35,
          isPremiumOnly: false,
          ageRange: [25, 35],
          genderRatio: "balanced",
          organizer: {
            id: "org_1",
            name: "NYC Dating Events",
            photo: "/placeholder.svg?height=100&width=100",
            isVerified: true,
          },
          tags: ["networking", "professional", "downtown", "rooftop"],
          requirements: ["Valid ID", "Professional attire"],
          whatToExpect: [
            "10 mini-dates (3 minutes each)",
            "Welcome drink included",
            "Match notifications next day",
            "Networking mixer after",
          ],
          isActive: true,
          registrationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          cancellationPolicy: "Full refund 24 hours before event",
        },
        {
          id: "event_2",
          title: "Singles Hiking Adventure",
          description: "Explore beautiful trails while meeting like-minded outdoor enthusiasts!",
          type: "outdoor",
          imageUrl: "/placeholder.svg?height=300&width=400&text=Hiking",
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          startTime: "9:00 AM",
          endTime: "2:00 PM",
          location: {
            name: "Central Park",
            address: "Central Park West",
            city: "New York",
            lat: 40.7829,
            lng: -73.9654,
          },
          capacity: 20,
          attendeeCount: 15,
          price: 25,
          isPremiumOnly: false,
          ageRange: [22, 40],
          organizer: {
            id: "org_2",
            name: "Adventure Singles",
            photo: "/placeholder.svg?height=100&width=100",
            isVerified: true,
          },
          tags: ["outdoor", "hiking", "nature", "fitness"],
          requirements: ["Comfortable hiking shoes", "Water bottle"],
          whatToExpect: [
            "3-hour guided hike",
            "Scenic photo opportunities",
            "Group lunch included",
            "Optional after-hike drinks",
          ],
          isActive: true,
          registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          cancellationPolicy: "50% refund 48 hours before event",
        },
        {
          id: "event_3",
          title: "Wine Tasting & Mixer",
          description: "Sophisticated evening of wine tasting with curated pairings and great company.",
          type: "cultural",
          imageUrl: "/placeholder.svg?height=300&width=400&text=Wine+Tasting",
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          startTime: "6:30 PM",
          endTime: "9:00 PM",
          location: {
            name: "Vintage Wine Bar",
            address: "456 Wine Street",
            city: "New York",
            lat: 40.7505,
            lng: -73.9934,
          },
          capacity: 30,
          attendeeCount: 22,
          price: 65,
          isPremiumOnly: true,
          ageRange: [28, 45],
          organizer: {
            id: "org_3",
            name: "Elite Singles NYC",
            photo: "/placeholder.svg?height=100&width=100",
            isVerified: true,
          },
          tags: ["wine", "upscale", "professional", "networking"],
          requirements: ["Business casual attire", "21+ ID required"],
          whatToExpect: [
            "5 premium wine tastings",
            "Artisan cheese pairings",
            "Wine education session",
            "Structured mingling",
          ],
          isActive: true,
          registrationDeadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          cancellationPolicy: "No refund 72 hours before event",
        },
      ]

      // Apply filters
      let filteredEvents = mockEvents

      if (filters.city) {
        filteredEvents = filteredEvents.filter((event) =>
          event.location.city.toLowerCase().includes(filters.city!.toLowerCase()),
        )
      }

      if (filters.type && filters.type.length > 0) {
        filteredEvents = filteredEvents.filter((event) => filters.type!.includes(event.type))
      }

      if (filters.priceRange) {
        filteredEvents = filteredEvents.filter(
          (event) => event.price >= filters.priceRange![0] && event.price <= filters.priceRange![1],
        )
      }

      if (filters.dateRange) {
        filteredEvents = filteredEvents.filter(
          (event) => event.date >= filters.dateRange![0] && event.date <= filters.dateRange![1],
        )
      }

      return filteredEvents.sort((a, b) => a.date.getTime() - b.date.getTime())
    } catch (error) {
      console.error("Get upcoming events error:", error)
      return []
    }
  }

  // Register for event
  static async registerForEvent(
    userId: string,
    eventId: string,
    specialRequests?: string,
  ): Promise<{
    success: boolean
    message: string
    attendee?: EventAttendee
  }> {
    try {
      // Check if user is already registered
      const existingRegistration = await this.getUserEventRegistration(userId, eventId)
      if (existingRegistration) {
        return {
          success: false,
          message: "You are already registered for this event",
        }
      }

      // Create new registration
      const attendee: EventAttendee = {
        id: `attendee_${Date.now()}`,
        eventId,
        userId,
        userName: "Current User", // Would get from user data
        userPhoto: "/placeholder.svg?height=100&width=100",
        userAge: 28, // Would get from user data
        registrationDate: new Date(),
        status: "registered",
        paymentStatus: "pending",
        specialRequests,
      }

      // In production, save to database
      if (supabase) {
        await supabase.from("event_attendees").insert({
          id: attendee.id,
          event_id: attendee.eventId,
          user_id: attendee.userId,
          user_name: attendee.userName,
          user_photo: attendee.userPhoto,
          user_age: attendee.userAge,
          registration_date: attendee.registrationDate.toISOString(),
          status: attendee.status,
          payment_status: attendee.paymentStatus,
          special_requests: attendee.specialRequests,
        })
      }

      return {
        success: true,
        message: "Successfully registered for event!",
        attendee,
      }
    } catch (error) {
      console.error("Register for event error:", error)
      return {
        success: false,
        message: "Failed to register for event. Please try again.",
      }
    }
  }

  // Get user's event registrations
  static async getUserEventRegistrations(userId: string): Promise<EventAttendee[]> {
    try {
      if (supabase) {
        const { data } = await supabase.from("event_attendees").select("*").eq("user_id", userId)

        return (
          data?.map((item) => ({
            id: item.id,
            eventId: item.event_id,
            userId: item.user_id,
            userName: item.user_name,
            userPhoto: item.user_photo,
            userAge: item.user_age,
            registrationDate: new Date(item.registration_date),
            status: item.status,
            paymentStatus: item.payment_status,
            specialRequests: item.special_requests,
          })) || []
        )
      }

      return []
    } catch (error) {
      console.error("Get user event registrations error:", error)
      return []
    }
  }

  // Get single event registration
  static async getUserEventRegistration(userId: string, eventId: string): Promise<EventAttendee | null> {
    try {
      if (supabase) {
        const { data } = await supabase
          .from("event_attendees")
          .select("*")
          .eq("user_id", userId)
          .eq("event_id", eventId)
          .single()

        if (data) {
          return {
            id: data.id,
            eventId: data.event_id,
            userId: data.user_id,
            userName: data.user_name,
            userPhoto: data.user_photo,
            userAge: data.user_age,
            registrationDate: new Date(data.registration_date),
            status: data.status,
            paymentStatus: data.payment_status,
            specialRequests: data.special_requests,
          }
        }
      }

      return null
    } catch (error) {
      console.error("Get user event registration error:", error)
      return null
    }
  }

  // Create group date
  static async createGroupDate(
    organizerId: string,
    groupDate: Omit<GroupDate, "id" | "organizer" | "participants" | "currentParticipants">,
  ): Promise<{ success: boolean; groupDate?: GroupDate; message: string }> {
    try {
      const newGroupDate: GroupDate = {
        ...groupDate,
        id: `group_${Date.now()}`,
        organizer: {
          id: organizerId,
          name: "Current User", // Would get from user data
          photo: "/placeholder.svg?height=100&width=100",
        },
        participants: [
          {
            id: organizerId,
            name: "Current User",
            photo: "/placeholder.svg?height=100&width=100",
            role: "organizer",
          },
        ],
        currentParticipants: 1,
      }

      // In production, save to database
      if (supabase) {
        await supabase.from("group_dates").insert({
          id: newGroupDate.id,
          title: newGroupDate.title,
          description: newGroupDate.description,
          type: newGroupDate.type,
          image_url: newGroupDate.imageUrl,
          date: newGroupDate.date.toISOString(),
          time: newGroupDate.time,
          location: JSON.stringify(newGroupDate.location),
          max_participants: newGroupDate.maxParticipants,
          current_participants: newGroupDate.currentParticipants,
          organizer_id: organizerId,
          cost: newGroupDate.cost,
          split_type: newGroupDate.splitType,
          requirements: JSON.stringify(newGroupDate.requirements),
          is_private: newGroupDate.isPrivate,
          invite_code: newGroupDate.inviteCode,
        })
      }

      return {
        success: true,
        groupDate: newGroupDate,
        message: "Group date created successfully!",
      }
    } catch (error) {
      console.error("Create group date error:", error)
      return {
        success: false,
        message: "Failed to create group date. Please try again.",
      }
    }
  }

  // Get nearby group dates
  static async getNearbyGroupDates(userId: string, city: string): Promise<GroupDate[]> {
    try {
      // Mock group dates for demo
      const mockGroupDates: GroupDate[] = [
        {
          id: "group_1",
          title: "Double Date Dinner",
          description: "Looking for another couple to join us for dinner at a nice Italian restaurant!",
          type: "double_date",
          imageUrl: "/placeholder.svg?height=200&width=300&text=Dinner",
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          time: "7:00 PM",
          location: {
            name: "Tony's Italian",
            address: "789 Food Street",
            city: "New York",
          },
          maxParticipants: 4,
          currentParticipants: 2,
          organizer: {
            id: "user_1",
            name: "Sarah & Mike",
            photo: "/placeholder.svg?height=100&width=100",
          },
          participants: [
            {
              id: "user_1",
              name: "Sarah",
              photo: "/placeholder.svg?height=100&width=100",
              role: "organizer",
            },
            {
              id: "user_2",
              name: "Mike",
              photo: "/placeholder.svg?height=100&width=100",
              role: "participant",
            },
          ],
          cost: 60,
          splitType: "equal",
          requirements: ["Couples only", "Ages 25-35"],
          isPrivate: false,
        },
        {
          id: "group_2",
          title: "Board Game Night",
          description: "Fun group hangout playing board games and getting to know each other!",
          type: "group_hangout",
          imageUrl: "/placeholder.svg?height=200&width=300&text=Board+Games",
          date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          time: "6:30 PM",
          location: {
            name: "Game Café",
            address: "321 Fun Avenue",
            city: "New York",
          },
          maxParticipants: 8,
          currentParticipants: 5,
          organizer: {
            id: "user_3",
            name: "Alex",
            photo: "/placeholder.svg?height=100&width=100",
          },
          participants: [
            {
              id: "user_3",
              name: "Alex",
              photo: "/placeholder.svg?height=100&width=100",
              role: "organizer",
            },
          ],
          cost: 15,
          splitType: "individual",
          requirements: ["Ages 22-35", "Beginner friendly"],
          isPrivate: false,
        },
      ]

      return mockGroupDates.filter((groupDate) => groupDate.location.city === city)
    } catch (error) {
      console.error("Get nearby group dates error:", error)
      return []
    }
  }

  // Join group date
  static async joinGroupDate(
    userId: string,
    groupDateId: string,
  ): Promise<{
    success: boolean
    message: string
  }> {
    try {
      // In production, update database
      if (supabase) {
        // Add user to participants
        // Update current_participants count
      }

      return {
        success: true,
        message: "Successfully joined group date!",
      }
    } catch (error) {
      console.error("Join group date error:", error)
      return {
        success: false,
        message: "Failed to join group date. Please try again.",
      }
    }
  }
}
