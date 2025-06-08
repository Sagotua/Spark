import { supabase, mockUsers } from "./supabase"
import type { User } from "./supabase"

interface UserBehavior {
  userId: string
  swipeHistory: Array<{
    swipedUserId: string
    isLike: boolean
    timestamp: Date
    userFeatures: UserFeatures
  }>
  messageActivity: number
  profileViews: number
  lastActive: Date
}

interface UserFeatures {
  age: number
  interests: string[]
  education?: string
  profession?: string
  location: { lat: number; lng: number }
  photos: number
  bioLength: number
  verified: boolean
  premium: boolean
}

interface CompatibilityScore {
  overall: number
  breakdown: {
    interests: number
    demographics: number
    activity: number
    behavior: number
    location: number
  }
  reasons: string[]
}

export class AdvancedMatchingService {
  private static userBehaviors: Map<string, UserBehavior> = new Map()
  private static interestWeights: Map<string, number> = new Map()

  static async initializeMatchingData() {
    // Initialize interest weights based on popularity
    const popularInterests = [
      "Travel",
      "Music",
      "Movies",
      "Food",
      "Fitness",
      "Photography",
      "Art",
      "Books",
      "Gaming",
      "Sports",
      "Nature",
      "Dancing",
    ]

    popularInterests.forEach((interest, index) => {
      this.interestWeights.set(interest, 1 - index * 0.05)
    })
  }

  static async getAdvancedMatches(
    userId: string,
    preferences: {
      ageRange: [number, number]
      maxDistance: number
      genderPreference: string
      dealBreakers?: string[]
      mustHaves?: string[]
    },
    limit = 20,
  ): Promise<Array<User & { compatibilityScore: CompatibilityScore; distance: number }>> {
    try {
      // Get user's behavior data
      const userBehavior = await this.getUserBehavior(userId)
      const currentUser = await this.getCurrentUser(userId)

      if (!currentUser) throw new Error("User not found")

      // Get potential matches
      const potentialMatches = await this.getPotentialMatches(userId, preferences)

      // Calculate compatibility scores
      const scoredMatches = await Promise.all(
        potentialMatches.map(async (user) => {
          const compatibilityScore = await this.calculateAdvancedCompatibility(
            currentUser,
            user,
            userBehavior,
            preferences,
          )

          const distance = this.calculateDistance(
            currentUser.location.lat,
            currentUser.location.lng,
            user.location.lat,
            user.location.lng,
          )

          return {
            ...user,
            compatibilityScore,
            distance,
          }
        }),
      )

      // Sort by compatibility score and apply ML ranking
      const rankedMatches = this.applyMLRanking(scoredMatches, userBehavior)

      return rankedMatches.slice(0, limit)
    } catch (error) {
      console.error("Advanced matching error:", error)
      // Fallback to basic matching
      return this.getFallbackMatches(userId, preferences, limit)
    }
  }

  private static async calculateAdvancedCompatibility(
    currentUser: User,
    targetUser: User,
    userBehavior: UserBehavior,
    preferences: any,
  ): Promise<CompatibilityScore> {
    const scores = {
      interests: this.calculateInterestCompatibility(currentUser, targetUser),
      demographics: this.calculateDemographicCompatibility(currentUser, targetUser, preferences),
      activity: this.calculateActivityCompatibility(currentUser, targetUser),
      behavior: this.calculateBehaviorCompatibility(targetUser, userBehavior),
      location: this.calculateLocationCompatibility(currentUser, targetUser, preferences.maxDistance),
    }

    // Weighted overall score
    const weights = {
      interests: 0.3,
      demographics: 0.2,
      activity: 0.2,
      behavior: 0.15,
      location: 0.15,
    }

    const overall = Object.entries(scores).reduce(
      (sum, [key, score]) => sum + score * weights[key as keyof typeof weights],
      0,
    )

    const reasons = this.generateCompatibilityReasons(scores, currentUser, targetUser)

    return {
      overall: Math.min(overall, 1),
      breakdown: scores,
      reasons,
    }
  }

  private static calculateInterestCompatibility(user1: User, user2: User): number {
    const interests1 = new Set(user1.interests)
    const interests2 = new Set(user2.interests)

    const commonInterests = [...interests1].filter((interest) => interests2.has(interest))
    const totalInterests = new Set([...interests1, ...interests2]).size

    if (totalInterests === 0) return 0

    // Weight common interests by their popularity
    const weightedCommon = commonInterests.reduce((sum, interest) => {
      return sum + (this.interestWeights.get(interest) || 0.5)
    }, 0)

    const baseScore = commonInterests.length / Math.max(interests1.size, interests2.size)
    const weightedScore = weightedCommon / Math.max(interests1.size, interests2.size)

    return baseScore * 0.6 + weightedScore * 0.4
  }

  private static calculateDemographicCompatibility(user1: User, user2: User, preferences: any): number {
    let score = 0

    // Age compatibility
    const ageDiff = Math.abs(user1.age - user2.age)
    const ageScore = Math.max(0, (10 - ageDiff) / 10)
    score += ageScore * 0.4

    // Education compatibility (if available)
    // This would be enhanced with actual education data
    score += 0.3

    // Lifestyle compatibility (inferred from interests and activity)
    const lifestyleScore = this.calculateLifestyleCompatibility(user1, user2)
    score += lifestyleScore * 0.3

    return Math.min(score, 1)
  }

  private static calculateActivityCompatibility(user1: User, user2: User): number {
    const now = new Date()
    const user1LastActive = new Date(user1.last_active)
    const user2LastActive = new Date(user2.last_active)

    const user1DaysInactive = (now.getTime() - user1LastActive.getTime()) / (1000 * 60 * 60 * 24)
    const user2DaysInactive = (now.getTime() - user2LastActive.getTime()) / (1000 * 60 * 60 * 24)

    // Both users should be relatively active
    const user1ActivityScore = Math.max(0, (7 - user1DaysInactive) / 7)
    const user2ActivityScore = Math.max(0, (7 - user2DaysInactive) / 7)

    return (user1ActivityScore + user2ActivityScore) / 2
  }

  private static calculateBehaviorCompatibility(targetUser: User, userBehavior: UserBehavior): number {
    // Analyze user's past swipe patterns to predict compatibility
    const similarUsers = userBehavior.swipeHistory.filter((swipe) => {
      const features = swipe.userFeatures
      return (
        Math.abs(features.age - targetUser.age) <= 3 &&
        features.interests.some((interest) => targetUser.interests.includes(interest))
      )
    })

    if (similarUsers.length === 0) return 0.5 // Neutral score

    const likeRate = similarUsers.filter((swipe) => swipe.isLike).length / similarUsers.length
    return likeRate
  }

  private static calculateLocationCompatibility(user1: User, user2: User, maxDistance: number): number {
    const distance = this.calculateDistance(
      user1.location.lat,
      user1.location.lng,
      user2.location.lat,
      user2.location.lng,
    )

    if (distance > maxDistance) return 0

    // Closer is better, but with diminishing returns
    return Math.max(0, (maxDistance - distance) / maxDistance)
  }

  private static calculateLifestyleCompatibility(user1: User, user2: User): number {
    // Infer lifestyle from interests
    const activeInterests = ["Fitness", "Sports", "Hiking", "Dancing", "Running"]
    const culturalInterests = ["Art", "Music", "Books", "Museums", "Theater"]
    const socialInterests = ["Travel", "Food", "Parties", "Bars", "Concerts"]

    const user1Active = user1.interests.filter((i) => activeInterests.includes(i)).length
    const user1Cultural = user1.interests.filter((i) => culturalInterests.includes(i)).length
    const user1Social = user1.interests.filter((i) => socialInterests.includes(i)).length

    const user2Active = user2.interests.filter((i) => activeInterests.includes(i)).length
    const user2Cultural = user2.interests.filter((i) => culturalInterests.includes(i)).length
    const user2Social = user2.interests.filter((i) => socialInterests.includes(i)).length

    // Calculate similarity in lifestyle preferences
    const activeSimilarity = 1 - Math.abs(user1Active - user2Active) / Math.max(user1Active + user2Active, 1)
    const culturalSimilarity = 1 - Math.abs(user1Cultural - user2Cultural) / Math.max(user1Cultural + user2Cultural, 1)
    const socialSimilarity = 1 - Math.abs(user1Social - user2Social) / Math.max(user1Social + user2Social, 1)

    return (activeSimilarity + culturalSimilarity + socialSimilarity) / 3
  }

  private static applyMLRanking(
    matches: Array<User & { compatibilityScore: CompatibilityScore; distance: number }>,
    userBehavior: UserBehavior,
  ) {
    // Apply machine learning-like ranking based on user behavior
    return matches
      .map((match) => {
        let mlScore = match.compatibilityScore.overall

        // Boost score based on user's historical preferences
        if (userBehavior.swipeHistory.length > 10) {
          const behaviorBoost = this.calculateBehaviorBoost(match, userBehavior)
          mlScore = mlScore * 0.7 + behaviorBoost * 0.3
        }

        // Premium users get slight boost
        if (match.is_premium) {
          mlScore += 0.05
        }

        // Verified users get boost
        if (match.is_verified) {
          mlScore += 0.03
        }

        return { ...match, mlScore }
      })
      .sort((a, b) => b.mlScore - a.mlScore)
  }

  private static calculateBehaviorBoost(match: User, userBehavior: UserBehavior): number {
    // Analyze patterns in user's swipe history
    const likedUsers = userBehavior.swipeHistory.filter((swipe) => swipe.isLike)

    if (likedUsers.length === 0) return 0.5

    // Find patterns in liked users
    const avgAge = likedUsers.reduce((sum, swipe) => sum + swipe.userFeatures.age, 0) / likedUsers.length
    const commonInterests = this.findCommonInterests(likedUsers.map((swipe) => swipe.userFeatures.interests))

    let boost = 0

    // Age preference boost
    const ageDiff = Math.abs(match.age - avgAge)
    boost += Math.max(0, (5 - ageDiff) / 5) * 0.3

    // Interest preference boost
    const matchInterestScore =
      match.interests.filter((interest) => commonInterests.includes(interest)).length /
      Math.max(match.interests.length, 1)
    boost += matchInterestScore * 0.4

    // Photo count preference
    const avgPhotoCount = likedUsers.reduce((sum, swipe) => sum + swipe.userFeatures.photos, 0) / likedUsers.length
    const photoScore = 1 - Math.abs(match.photos.length - avgPhotoCount) / Math.max(avgPhotoCount, 1)
    boost += photoScore * 0.3

    return Math.min(boost, 1)
  }

  private static findCommonInterests(interestArrays: string[][]): string[] {
    const interestCounts = new Map<string, number>()

    interestArrays.forEach((interests) => {
      interests.forEach((interest) => {
        interestCounts.set(interest, (interestCounts.get(interest) || 0) + 1)
      })
    })

    // Return interests that appear in at least 30% of liked profiles
    const threshold = Math.max(1, Math.floor(interestArrays.length * 0.3))
    return Array.from(interestCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([interest, _]) => interest)
  }

  private static generateCompatibilityReasons(scores: any, user1: User, user2: User): string[] {
    const reasons: string[] = []

    if (scores.interests > 0.7) {
      const commonInterests = user1.interests.filter((interest) => user2.interests.includes(interest))
      reasons.push(`You both love ${commonInterests.slice(0, 2).join(" and ")}`)
    }

    if (scores.demographics > 0.6) {
      const ageDiff = Math.abs(user1.age - user2.age)
      if (ageDiff <= 3) {
        reasons.push("You're close in age")
      }
    }

    if (scores.activity > 0.7) {
      reasons.push("You're both active users")
    }

    if (scores.location > 0.8) {
      reasons.push("You're nearby")
    }

    if (user2.is_verified) {
      reasons.push("Verified profile")
    }

    return reasons.slice(0, 3) // Limit to top 3 reasons
  }

  // Helper methods
  private static async getUserBehavior(userId: string): Promise<UserBehavior> {
    if (this.userBehaviors.has(userId)) {
      return this.userBehaviors.get(userId)!
    }

    // Mock behavior data for demo
    const mockBehavior: UserBehavior = {
      userId,
      swipeHistory: [],
      messageActivity: Math.floor(Math.random() * 50),
      profileViews: Math.floor(Math.random() * 100),
      lastActive: new Date(),
    }

    this.userBehaviors.set(userId, mockBehavior)
    return mockBehavior
  }

  private static async getCurrentUser(userId: string): Promise<User | null> {
    if (!supabase) {
      return mockUsers.find((u) => u.id === userId) || mockUsers[0]
    }

    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

      if (error) throw error
      return data
    } catch (error) {
      console.error("Get current user error:", error)
      return null
    }
  }

  private static async getPotentialMatches(userId: string, preferences: any): Promise<User[]> {
    if (!supabase) {
      return mockUsers.filter((u) => u.id !== userId)
    }

    try {
      // Get users that haven't been swiped on yet
      const { data: swipedUserIds } = await supabase.from("swipes").select("swiped_id").eq("swiper_id", userId)

      const excludeIds = swipedUserIds?.map((s) => s.swiped_id) || []
      excludeIds.push(userId)

      let query = supabase
        .from("users")
        .select("*")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .gte("age", preferences.ageRange[0])
        .lte("age", preferences.ageRange[1])

      if (preferences.genderPreference !== "all") {
        query = query.eq("gender", preferences.genderPreference)
      }

      const { data, error } = await query.limit(50)
      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Get potential matches error:", error)
      return []
    }
  }

  private static getFallbackMatches(
    userId: string,
    preferences: any,
    limit: number,
  ): Array<User & { compatibilityScore: CompatibilityScore; distance: number }> {
    return mockUsers
      .filter((u) => u.id !== userId)
      .slice(0, limit)
      .map((user) => ({
        ...user,
        compatibilityScore: {
          overall: Math.random() * 0.5 + 0.3,
          breakdown: {
            interests: Math.random(),
            demographics: Math.random(),
            activity: Math.random(),
            behavior: Math.random(),
            location: Math.random(),
          },
          reasons: ["Demo compatibility"],
        },
        distance: Math.random() * 50,
      }))
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

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  static async recordSwipeForML(swiperId: string, swipedUser: User, isLike: boolean) {
    const userBehavior = await this.getUserBehavior(swiperId)

    const swipeRecord = {
      swipedUserId: swipedUser.id,
      isLike,
      timestamp: new Date(),
      userFeatures: {
        age: swipedUser.age,
        interests: swipedUser.interests,
        location: swipedUser.location,
        photos: swipedUser.photos.length,
        bioLength: swipedUser.bio?.length || 0,
        verified: swipedUser.is_verified,
        premium: swipedUser.is_premium,
      },
    }

    userBehavior.swipeHistory.push(swipeRecord)

    // Keep only last 100 swipes for performance
    if (userBehavior.swipeHistory.length > 100) {
      userBehavior.swipeHistory = userBehavior.swipeHistory.slice(-100)
    }

    this.userBehaviors.set(swiperId, userBehavior)
  }
}
