import { supabase } from "./supabase"
import type { User } from "./supabase"

export interface DiscoveryFilters {
  ageRange: [number, number]
  maxDistance: number
  genderPreference: "male" | "female" | "all"
  interests: string[]
  lifestyle: {
    smoking: "never" | "sometimes" | "regularly" | "any"
    drinking: "never" | "socially" | "regularly" | "any"
    exercise: "never" | "sometimes" | "regularly" | "any"
    diet: "omnivore" | "vegetarian" | "vegan" | "any"
  }
  education: {
    level: "high_school" | "college" | "graduate" | "any"
    required: boolean
  }
  profession: {
    categories: string[]
    required: boolean
  }
  relationship: {
    type: "casual" | "serious" | "marriage" | "any"
    hasKids: "yes" | "no" | "any"
    wantsKids: "yes" | "no" | "maybe" | "any"
  }
  dealBreakers: string[]
  mustHaves: string[]
  verifiedOnly: boolean
  premiumOnly: boolean
  recentlyActive: boolean // Active within last 7 days
}

export interface FilteredUser extends User {
  matchScore: number
  matchReasons: string[]
  distance: number
  lastActiveHours: number
}

const mockUsers: User[] = [
  {
    id: "1",
    created_at: new Date().toISOString(),
    email: "test1@example.com",
    age: 25,
    gender: "female",
    location: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
    interests: ["hiking", "reading", "movies"],
    bio: "I love exploring new places and meeting new people.",
    photos: [],
    is_verified: true,
    is_premium: false,
    last_active: new Date().toISOString(),
  },
  {
    id: "2",
    created_at: new Date().toISOString(),
    email: "test2@example.com",
    age: 30,
    gender: "male",
    location: { lat: 40.7128, lng: -74.006 }, // New York
    interests: ["sports", "music", "travel"],
    bio: "Looking for someone to share adventures with.",
    photos: [],
    is_verified: false,
    is_premium: true,
    last_active: new Date().toISOString(),
  },
  {
    id: "3",
    created_at: new Date().toISOString(),
    email: "test3@example.com",
    age: 22,
    gender: "female",
    location: { lat: 51.5074, lng: 0.1278 }, // London
    interests: ["art", "fashion", "photography"],
    bio: "Aspiring photographer with a passion for life.",
    photos: [],
    is_verified: true,
    is_premium: true,
    last_active: new Date().toISOString(),
  },
  {
    id: "4",
    created_at: new Date().toISOString(),
    email: "test4@example.com",
    age: 28,
    gender: "male",
    location: { lat: 37.7749, lng: -122.4194 }, // San Francisco
    interests: ["technology", "startups", "coffee"],
    bio: "Building the future, one line of code at a time.",
    photos: [],
    is_verified: false,
    is_premium: false,
    last_active: new Date().toISOString(),
  },
]

export class DiscoveryFilterService {
  private static readonly DEFAULT_FILTERS: DiscoveryFilters = {
    ageRange: [18, 35],
    maxDistance: 50,
    genderPreference: "all",
    interests: [],
    lifestyle: {
      smoking: "any",
      drinking: "any",
      exercise: "any",
      diet: "any",
    },
    education: {
      level: "any",
      required: false,
    },
    profession: {
      categories: [],
      required: false,
    },
    relationship: {
      type: "any",
      hasKids: "any",
      wantsKids: "any",
    },
    dealBreakers: [],
    mustHaves: [],
    verifiedOnly: false,
    premiumOnly: false,
    recentlyActive: false,
  }

  static async getFilteredUsers(
    currentUserId: string,
    filters: DiscoveryFilters,
    currentLocation: { lat: number; lng: number },
    limit = 50,
  ): Promise<FilteredUser[]> {
    try {
      // Get base user pool
      const users = await this.getBaseUserPool(currentUserId, filters)

      // Apply filters
      const filteredUsers = users
        .filter((user) => this.applyBasicFilters(user, filters))
        .filter((user) => this.applyLifestyleFilters(user, filters))
        .filter((user) => this.applyEducationFilters(user, filters))
        .filter((user) => this.applyRelationshipFilters(user, filters))
        .filter((user) => this.applyDealBreakers(user, filters))
        .map((user) => this.enhanceUserWithMetrics(user, filters, currentLocation))
        .filter((user) => this.applyDistanceFilter(user, filters))
        .filter((user) => this.applyMustHaves(user, filters))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit)

      return filteredUsers
    } catch (error) {
      console.error("Get filtered users error:", error)
      return []
    }
  }

  private static async getBaseUserPool(currentUserId: string, filters: DiscoveryFilters): Promise<User[]> {
    if (!supabase) {
      // Return mock users for demo
      return mockUsers.filter((u) => u.id !== currentUserId)
    }

    try {
      // Get users that haven't been swiped on
      const { data: swipedUserIds } = await supabase.from("swipes").select("swiped_id").eq("swiper_id", currentUserId)

      const excludeIds = swipedUserIds?.map((s) => s.swiped_id) || []
      excludeIds.push(currentUserId)

      let query = supabase
        .from("users")
        .select("*")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .gte("age", filters.ageRange[0])
        .lte("age", filters.ageRange[1])

      // Apply basic filters at database level
      if (filters.genderPreference !== "all") {
        query = query.eq("gender", filters.genderPreference)
      }

      if (filters.verifiedOnly) {
        query = query.eq("is_verified", true)
      }

      if (filters.premiumOnly) {
        query = query.eq("is_premium", true)
      }

      if (filters.recentlyActive) {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        query = query.gte("last_active", sevenDaysAgo.toISOString())
      }

      const { data, error } = await query.limit(200) // Get larger pool for filtering

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Get base user pool error:", error)
      return []
    }
  }

  private static applyBasicFilters(user: User, filters: DiscoveryFilters): boolean {
    // Interest filter
    if (filters.interests.length > 0) {
      const hasCommonInterest = filters.interests.some((interest) => user.interests.includes(interest))
      if (!hasCommonInterest) return false
    }

    return true
  }

  private static applyLifestyleFilters(user: User, filters: DiscoveryFilters): boolean {
    // In a real app, users would have lifestyle data
    // For demo, we'll randomly assign lifestyle preferences
    const userLifestyle = this.getUserLifestyle(user.id)

    if (filters.lifestyle.smoking !== "any" && userLifestyle.smoking !== filters.lifestyle.smoking) {
      return false
    }

    if (filters.lifestyle.drinking !== "any" && userLifestyle.drinking !== filters.lifestyle.drinking) {
      return false
    }

    if (filters.lifestyle.exercise !== "any" && userLifestyle.exercise !== filters.lifestyle.exercise) {
      return false
    }

    if (filters.lifestyle.diet !== "any" && userLifestyle.diet !== filters.lifestyle.diet) {
      return false
    }

    return true
  }

  private static applyEducationFilters(user: User, filters: DiscoveryFilters): boolean {
    if (!filters.education.required || filters.education.level === "any") {
      return true
    }

    // In a real app, users would have education data
    const userEducation = this.getUserEducation(user.id)
    return userEducation === filters.education.level
  }

  private static applyRelationshipFilters(user: User, filters: DiscoveryFilters): boolean {
    // In a real app, users would have relationship preference data
    const userRelationship = this.getUserRelationshipPrefs(user.id)

    if (filters.relationship.type !== "any" && userRelationship.type !== filters.relationship.type) {
      return false
    }

    if (filters.relationship.hasKids !== "any" && userRelationship.hasKids !== filters.relationship.hasKids) {
      return false
    }

    if (filters.relationship.wantsKids !== "any" && userRelationship.wantsKids !== filters.relationship.wantsKids) {
      return false
    }

    return true
  }

  private static applyDealBreakers(user: User, filters: DiscoveryFilters): boolean {
    // Check if user has any deal breakers
    const userTraits = this.getUserTraits(user)

    return !filters.dealBreakers.some((dealBreaker) => userTraits.includes(dealBreaker))
  }

  private static applyMustHaves(user: FilteredUser, filters: DiscoveryFilters): boolean {
    if (filters.mustHaves.length === 0) return true

    const userTraits = this.getUserTraits(user)
    return filters.mustHaves.every((mustHave) => userTraits.includes(mustHave))
  }

  private static applyDistanceFilter(user: FilteredUser, filters: DiscoveryFilters): boolean {
    return user.distance <= filters.maxDistance
  }

  private static enhanceUserWithMetrics(
    user: User,
    filters: DiscoveryFilters,
    currentLocation: { lat: number; lng: number },
  ): FilteredUser {
    const distance = this.calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      user.location.lat,
      user.location.lng,
    )

    const lastActiveHours = this.calculateLastActiveHours(user.last_active)
    const matchScore = this.calculateMatchScore(user, filters)
    const matchReasons = this.generateMatchReasons(user, filters)

    return {
      ...user,
      distance,
      lastActiveHours,
      matchScore,
      matchReasons,
    }
  }

  private static calculateMatchScore(user: User, filters: DiscoveryFilters): number {
    let score = 0

    // Interest compatibility (30%)
    if (filters.interests.length > 0) {
      const commonInterests = filters.interests.filter((interest) => user.interests.includes(interest))
      score += (commonInterests.length / filters.interests.length) * 0.3
    } else {
      score += 0.3 // No preference = full score
    }

    // Age compatibility (20%)
    const idealAge = (filters.ageRange[0] + filters.ageRange[1]) / 2
    const ageDiff = Math.abs(user.age - idealAge)
    const ageScore = Math.max(0, (10 - ageDiff) / 10)
    score += ageScore * 0.2

    // Profile completeness (20%)
    let completeness = 0
    if (user.bio && user.bio.length > 20) completeness += 0.3
    if (user.photos && user.photos.length >= 3) completeness += 0.4
    if (user.interests && user.interests.length >= 3) completeness += 0.3
    score += completeness * 0.2

    // Activity score (15%)
    const lastActiveHours = this.calculateLastActiveHours(user.last_active)
    const activityScore = Math.max(0, (168 - lastActiveHours) / 168) // 1 week
    score += activityScore * 0.15

    // Premium/verified boost (15%)
    if (user.is_verified) score += 0.08
    if (user.is_premium) score += 0.07

    return Math.min(score, 1)
  }

  private static generateMatchReasons(user: User, filters: DiscoveryFilters): string[] {
    const reasons: string[] = []

    // Common interests
    const commonInterests = filters.interests.filter((interest) => user.interests.includes(interest))
    if (commonInterests.length > 0) {
      reasons.push(`You both love ${commonInterests.slice(0, 2).join(" and ")}`)
    }

    // Age compatibility
    const ageDiff = Math.abs(user.age - (filters.ageRange[0] + filters.ageRange[1]) / 2)
    if (ageDiff <= 2) {
      reasons.push("Perfect age match")
    }

    // Activity
    const lastActiveHours = this.calculateLastActiveHours(user.last_active)
    if (lastActiveHours <= 24) {
      reasons.push("Recently active")
    }

    // Verification
    if (user.is_verified) {
      reasons.push("Verified profile")
    }

    // Profile quality
    if (user.photos.length >= 4 && user.bio && user.bio.length > 50) {
      reasons.push("Complete profile")
    }

    return reasons.slice(0, 3)
  }

  // Helper methods for demo data
  private static getUserLifestyle(userId: string) {
    const hash = this.hashString(userId)
    return {
      smoking: ["never", "sometimes", "regularly"][hash % 3],
      drinking: ["never", "socially", "regularly"][hash % 3],
      exercise: ["never", "sometimes", "regularly"][hash % 3],
      diet: ["omnivore", "vegetarian", "vegan"][hash % 3],
    }
  }

  private static getUserEducation(userId: string) {
    const hash = this.hashString(userId)
    return ["high_school", "college", "graduate"][hash % 3]
  }

  private static getUserRelationshipPrefs(userId: string) {
    const hash = this.hashString(userId)
    return {
      type: ["casual", "serious", "marriage"][hash % 3],
      hasKids: ["yes", "no"][hash % 2],
      wantsKids: ["yes", "no", "maybe"][hash % 3],
    }
  }

  private static getUserTraits(user: User): string[] {
    const traits = [...user.interests]

    // Add lifestyle traits
    const lifestyle = this.getUserLifestyle(user.id)
    if (lifestyle.smoking !== "never") traits.push("smoker")
    if (lifestyle.drinking === "regularly") traits.push("drinks_regularly")
    if (lifestyle.exercise === "regularly") traits.push("fitness_enthusiast")
    if (lifestyle.diet !== "omnivore") traits.push("special_diet")

    // Add other traits
    if (user.is_verified) traits.push("verified")
    if (user.is_premium) traits.push("premium")
    if (user.photos.length >= 5) traits.push("many_photos")

    return traits
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static calculateLastActiveHours(lastActive: string): number {
    return (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60)
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private static hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  static getDefaultFilters(): DiscoveryFilters {
    return { ...this.DEFAULT_FILTERS }
  }

  static async saveFilters(userId: string, filters: DiscoveryFilters): Promise<void> {
    try {
      if (!supabase) return

      await supabase.from("user_filters").upsert({
        user_id: userId,
        filters,
        updated_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Save filters error:", error)
    }
  }

  static async loadFilters(userId: string): Promise<DiscoveryFilters> {
    try {
      if (!supabase) return this.DEFAULT_FILTERS

      const { data, error } = await supabase.from("user_filters").select("filters").eq("user_id", userId).single()

      if (error || !data) return this.DEFAULT_FILTERS

      return { ...this.DEFAULT_FILTERS, ...data.filters }
    } catch (error) {
      console.error("Load filters error:", error)
      return this.DEFAULT_FILTERS
    }
  }
}
