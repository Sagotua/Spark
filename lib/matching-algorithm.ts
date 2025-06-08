import { supabase, mockUsers } from "./supabase"
import type { User } from "./supabase"

interface MatchingCriteria {
  userId: string
  maxDistance: number
  ageRange: [number, number]
  genderPreference: string
  interests: string[]
  location: { lat: number; lng: number }
}

export class MatchingService {
  static async getCompatibleUsers(criteria: MatchingCriteria): Promise<User[]> {
    try {
      if (!supabase) {
        // Use mock data when Supabase isn't configured
        const compatibleUsers = mockUsers
          .filter((user) => user.id !== criteria.userId)
          .filter((user) => {
            // Age filter
            return user.age >= criteria.ageRange[0] && user.age <= criteria.ageRange[1]
          })
          .filter((user) => {
            // Gender filter
            if (criteria.genderPreference === "all") return true
            return user.gender === criteria.genderPreference
          })
          .filter((user) => {
            // Distance filter (mock - all users are within range)
            if (!user.location) return false
            const distance = this.calculateDistance(
              criteria.location.lat,
              criteria.location.lng,
              user.location.lat,
              user.location.lng,
            )
            return distance <= criteria.maxDistance
          })
          .map((user) => ({
            ...user,
            compatibilityScore: this.calculateCompatibilityScore(criteria, user),
            distance: this.calculateDistance(
              criteria.location.lat,
              criteria.location.lng,
              user.location.lat,
              user.location.lng,
            ),
          }))
          .sort((a, b) => b.compatibilityScore - a.compatibilityScore)

        return compatibleUsers
      }

      // Get users that haven't been swiped on yet
      const { data: swipedUserIds } = await supabase.from("swipes").select("swiped_id").eq("swiper_id", criteria.userId)

      const excludeIds = swipedUserIds?.map((s) => s.swiped_id) || []
      excludeIds.push(criteria.userId) // Exclude self

      // Base query for compatible users
      let query = supabase
        .from("users")
        .select("*")
        .not("id", "in", `(${excludeIds.join(",")})`)
        .gte("age", criteria.ageRange[0])
        .lte("age", criteria.ageRange[1])
        .eq("is_verified", true) // Only show verified users

      // Filter by gender preference
      if (criteria.genderPreference !== "all") {
        query = query.eq("gender", criteria.genderPreference)
      }

      const { data: users, error } = await query

      if (error) throw error

      // Filter by distance and calculate compatibility scores
      const compatibleUsers =
        users
          ?.filter((user) => {
            if (!user.location) return false
            const distance = this.calculateDistance(
              criteria.location.lat,
              criteria.location.lng,
              user.location.lat,
              user.location.lng,
            )
            return distance <= criteria.maxDistance
          })
          .map((user) => ({
            ...user,
            compatibilityScore: this.calculateCompatibilityScore(criteria, user),
            distance: this.calculateDistance(
              criteria.location.lat,
              criteria.location.lng,
              user.location.lat,
              user.location.lng,
            ),
          }))
          .sort((a, b) => b.compatibilityScore - a.compatibilityScore) || []

      return compatibleUsers
    } catch (error) {
      console.error("Get compatible users error:", error)
      throw error
    }
  }

  static calculateCompatibilityScore(criteria: MatchingCriteria, user: User): number {
    let score = 0

    // Interest compatibility (40%)
    const commonInterests = criteria.interests.filter((interest) => user.interests.includes(interest))
    const interestScore = commonInterests.length / Math.max(criteria.interests.length, user.interests.length, 1)
    score += interestScore * 0.4

    // Age compatibility (20%)
    const ageDiff = Math.abs((criteria.ageRange[0] + criteria.ageRange[1]) / 2 - user.age)
    const ageScore = Math.max(0, (10 - ageDiff) / 10)
    score += ageScore * 0.2

    // Activity score (20%) - based on last_active
    const lastActive = new Date(user.last_active)
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    const activityScore = Math.max(0, (7 - daysSinceActive) / 7)
    score += activityScore * 0.2

    // Profile completeness (10%)
    let completeness = 0
    if (user.bio && user.bio.length > 20) completeness += 0.3
    if (user.photos && user.photos.length >= 3) completeness += 0.4
    if (user.interests && user.interests.length >= 3) completeness += 0.3
    score += completeness * 0.1

    // Premium boost (10%)
    if (user.is_premium) score += 0.1

    return Math.min(score, 1)
  }

  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  static async recordSwipe(swiperId: string, swipedId: string, isLike: boolean, isSuperLike = false) {
    try {
      if (!supabase) {
        // Mock response for demo
        return {
          swipe: { id: Date.now().toString(), swiper_id: swiperId, swiped_id: swipedId, is_like: isLike },
          isMatch: isLike && Math.random() > 0.7, // 30% chance of match for demo
          match: isLike ? { id: Date.now().toString(), user1_id: swiperId, user2_id: swipedId, is_mutual: true } : null,
        }
      }

      const { data, error } = await supabase
        .from("swipes")
        .insert({
          swiper_id: swiperId,
          swiped_id: swipedId,
          is_like: isLike,
          is_super_like: isSuperLike,
        })
        .select()

      if (error) throw error

      // Check if this creates a match
      if (isLike) {
        const { data: matchData } = await supabase
          .from("matches")
          .select("*")
          .or(
            `and(user1_id.eq.${swiperId},user2_id.eq.${swipedId}),and(user1_id.eq.${swipedId},user2_id.eq.${swiperId})`,
          )
          .eq("is_mutual", true)
          .single()

        return { swipe: data, isMatch: !!matchData, match: matchData }
      }

      return { swipe: data, isMatch: false }
    } catch (error) {
      console.error("Record swipe error:", error)
      throw error
    }
  }
}
