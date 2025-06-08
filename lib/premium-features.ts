import { supabase } from "./supabase"

export interface SuperLike {
  id: string
  userId: string
  targetUserId: string
  timestamp: Date
  isActive: boolean
}

export interface Boost {
  id: string
  userId: string
  startTime: Date
  endTime: Date
  isActive: boolean
  viewsGenerated: number
  likesGenerated: number
}

export interface RewindAction {
  id: string
  userId: string
  targetUserId: string
  originalAction: "like" | "pass"
  timestamp: Date
}

export interface PassportLocation {
  id: string
  userId: string
  latitude: number
  longitude: number
  city: string
  country: string
  isActive: boolean
  timestamp: Date
}

export interface PremiumUsage {
  userId: string
  superLikesUsed: number
  superLikesLimit: number
  boostsUsed: number
  boostsLimit: number
  rewindsUsed: number
  rewindsLimit: number
  lastResetDate: Date
}

export class PremiumFeaturesService {
  // Super Likes
  static async sendSuperLike(userId: string, targetUserId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user has super likes available
      const usage = await this.getPremiumUsage(userId)
      const userProfile = await this.getUserProfile(userId)

      if (!userProfile.is_premium && usage.superLikesUsed >= usage.superLikesLimit) {
        return { success: false, message: "You've used all your Super Likes for today. Upgrade to Premium for more!" }
      }

      // Check if already super liked this user
      const existingSuperLike = await this.getExistingSuperLike(userId, targetUserId)
      if (existingSuperLike) {
        return { success: false, message: "You've already Super Liked this person!" }
      }

      // Create super like
      const superLike: SuperLike = {
        id: Date.now().toString(),
        userId,
        targetUserId,
        timestamp: new Date(),
        isActive: true,
      }

      // Save to database
      if (supabase) {
        await supabase.from("super_likes").insert({
          id: superLike.id,
          user_id: superLike.userId,
          target_user_id: superLike.targetUserId,
          timestamp: superLike.timestamp.toISOString(),
          is_active: superLike.isActive,
        })
      }

      // Update usage
      await this.updatePremiumUsage(userId, { superLikesUsed: usage.superLikesUsed + 1 })

      // Send notification to target user
      await this.sendSuperLikeNotification(targetUserId, userId)

      return { success: true, message: "Super Like sent! They'll be notified that you're really interested." }
    } catch (error) {
      console.error("Super like error:", error)
      return { success: false, message: "Failed to send Super Like. Please try again." }
    }
  }

  // Boosts
  static async activateBoost(userId: string): Promise<{ success: boolean; message: string; boost?: Boost }> {
    try {
      const usage = await this.getPremiumUsage(userId)
      const userProfile = await this.getUserProfile(userId)

      if (!userProfile.is_premium && usage.boostsUsed >= usage.boostsLimit) {
        return { success: false, message: "You've used all your Boosts for today. Upgrade to Premium for more!" }
      }

      // Check if user already has an active boost
      const activeBoost = await this.getActiveBoost(userId)
      if (activeBoost) {
        const timeLeft = Math.ceil((activeBoost.endTime.getTime() - Date.now()) / (1000 * 60))
        return { success: false, message: `You already have an active Boost with ${timeLeft} minutes remaining.` }
      }

      // Create boost (30 minutes)
      const boost: Boost = {
        id: Date.now().toString(),
        userId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        isActive: true,
        viewsGenerated: 0,
        likesGenerated: 0,
      }

      // Save to database
      if (supabase) {
        await supabase.from("boosts").insert({
          id: boost.id,
          user_id: boost.userId,
          start_time: boost.startTime.toISOString(),
          end_time: boost.endTime.toISOString(),
          is_active: boost.isActive,
          views_generated: boost.viewsGenerated,
          likes_generated: boost.likesGenerated,
        })
      }

      // Update usage
      await this.updatePremiumUsage(userId, { boostsUsed: usage.boostsUsed + 1 })

      // Start boost tracking
      this.trackBoostPerformance(boost.id)

      return {
        success: true,
        message: "Boost activated! You'll be one of the top profiles in your area for the next 30 minutes.",
        boost,
      }
    } catch (error) {
      console.error("Boost activation error:", error)
      return { success: false, message: "Failed to activate Boost. Please try again." }
    }
  }

  // Rewind
  static async rewindLastSwipe(userId: string): Promise<{ success: boolean; message: string; rewindedUser?: any }> {
    try {
      const usage = await this.getPremiumUsage(userId)
      const userProfile = await this.getUserProfile(userId)

      if (!userProfile.is_premium && usage.rewindsUsed >= usage.rewindsLimit) {
        return {
          success: false,
          message: "You've used all your Rewinds for today. Upgrade to Premium for unlimited Rewinds!",
        }
      }

      // Get last swipe action
      const lastSwipe = await this.getLastSwipeAction(userId)
      if (!lastSwipe) {
        return { success: false, message: "No recent swipes to rewind." }
      }

      if (lastSwipe.action === "like") {
        return { success: false, message: "You can only rewind 'pass' actions, not likes." }
      }

      // Check if already rewound this action
      const existingRewind = await this.getExistingRewind(userId, lastSwipe.targetUserId)
      if (existingRewind) {
        return { success: false, message: "You've already rewound this swipe." }
      }

      // Create rewind record
      const rewind: RewindAction = {
        id: Date.now().toString(),
        userId,
        targetUserId: lastSwipe.targetUserId,
        originalAction: lastSwipe.action,
        timestamp: new Date(),
      }

      // Save to database
      if (supabase) {
        await supabase.from("rewind_actions").insert({
          id: rewind.id,
          user_id: rewind.userId,
          target_user_id: rewind.targetUserId,
          original_action: rewind.originalAction,
          timestamp: rewind.timestamp.toISOString(),
        })

        // Remove the original swipe action
        await supabase.from("swipe_actions").delete().match({
          user_id: userId,
          target_user_id: lastSwipe.targetUserId,
        })
      }

      // Update usage
      if (!userProfile.is_premium) {
        await this.updatePremiumUsage(userId, { rewindsUsed: usage.rewindsUsed + 1 })
      }

      // Get the user that was rewound
      const rewindedUser = await this.getUserProfile(lastSwipe.targetUserId)

      return {
        success: true,
        message: "Swipe rewound! You can now see this person again.",
        rewindedUser,
      }
    } catch (error) {
      console.error("Rewind error:", error)
      return { success: false, message: "Failed to rewind swipe. Please try again." }
    }
  }

  // Passport (Location Change)
  static async setPassportLocation(
    userId: string,
    latitude: number,
    longitude: number,
    city: string,
    country: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userProfile = await this.getUserProfile(userId)

      if (!userProfile.is_premium) {
        return { success: false, message: "Passport is a Premium feature. Upgrade to change your location!" }
      }

      // Deactivate current passport location
      if (supabase) {
        await supabase.from("passport_locations").update({ is_active: false }).match({ user_id: userId })
      }

      // Create new passport location
      const passportLocation: PassportLocation = {
        id: Date.now().toString(),
        userId,
        latitude,
        longitude,
        city,
        country,
        isActive: true,
        timestamp: new Date(),
      }

      // Save to database
      if (supabase) {
        await supabase.from("passport_locations").insert({
          id: passportLocation.id,
          user_id: passportLocation.userId,
          latitude: passportLocation.latitude,
          longitude: passportLocation.longitude,
          city: passportLocation.city,
          country: passportLocation.country,
          is_active: passportLocation.isActive,
          timestamp: passportLocation.timestamp.toISOString(),
        })
      }

      return {
        success: true,
        message: `Location changed to ${city}, ${country}! You'll now see people in this area.`,
      }
    } catch (error) {
      console.error("Passport error:", error)
      return { success: false, message: "Failed to change location. Please try again." }
    }
  }

  // Read Receipts
  static async markMessageAsRead(messageId: string, readerId: string): Promise<void> {
    try {
      if (supabase) {
        await supabase.from("message_read_receipts").insert({
          message_id: messageId,
          reader_id: readerId,
          read_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("Mark message as read error:", error)
    }
  }

  static async getMessageReadStatus(messageId: string): Promise<{ isRead: boolean; readAt?: Date }> {
    try {
      if (supabase) {
        const { data } = await supabase
          .from("message_read_receipts")
          .select("read_at")
          .eq("message_id", messageId)
          .single()

        if (data) {
          return { isRead: true, readAt: new Date(data.read_at) }
        }
      }
      return { isRead: false }
    } catch (error) {
      console.error("Get message read status error:", error)
      return { isRead: false }
    }
  }

  // Premium Usage Management
  static async getPremiumUsage(userId: string): Promise<PremiumUsage> {
    try {
      if (supabase) {
        const { data } = await supabase.from("premium_usage").select("*").eq("user_id", userId).single()

        if (data) {
          const usage: PremiumUsage = {
            userId: data.user_id,
            superLikesUsed: data.super_likes_used,
            superLikesLimit: data.super_likes_limit,
            boostsUsed: data.boosts_used,
            boostsLimit: data.boosts_limit,
            rewindsUsed: data.rewinds_used,
            rewindsLimit: data.rewinds_limit,
            lastResetDate: new Date(data.last_reset_date),
          }

          // Check if we need to reset daily limits
          const today = new Date()
          const lastReset = new Date(usage.lastResetDate)

          if (today.toDateString() !== lastReset.toDateString()) {
            return await this.resetDailyLimits(userId)
          }

          return usage
        }
      }

      // Create default usage record
      return await this.createDefaultUsage(userId)
    } catch (error) {
      console.error("Get premium usage error:", error)
      return await this.createDefaultUsage(userId)
    }
  }

  private static async createDefaultUsage(userId: string): Promise<PremiumUsage> {
    const defaultUsage: PremiumUsage = {
      userId,
      superLikesUsed: 0,
      superLikesLimit: 1, // Free users get 1 super like per day
      boostsUsed: 0,
      boostsLimit: 0, // Free users get 0 boosts
      rewindsUsed: 0,
      rewindsLimit: 0, // Free users get 0 rewinds
      lastResetDate: new Date(),
    }

    if (supabase) {
      await supabase.from("premium_usage").insert({
        user_id: defaultUsage.userId,
        super_likes_used: defaultUsage.superLikesUsed,
        super_likes_limit: defaultUsage.superLikesLimit,
        boosts_used: defaultUsage.boostsUsed,
        boosts_limit: defaultUsage.boostsLimit,
        rewinds_used: defaultUsage.rewindsUsed,
        rewinds_limit: defaultUsage.rewindsLimit,
        last_reset_date: defaultUsage.lastResetDate.toISOString(),
      })
    }

    return defaultUsage
  }

  private static async resetDailyLimits(userId: string): Promise<PremiumUsage> {
    const userProfile = await this.getUserProfile(userId)

    const resetUsage: PremiumUsage = {
      userId,
      superLikesUsed: 0,
      superLikesLimit: userProfile.is_premium ? 5 : 1, // Premium gets 5, free gets 1
      boostsUsed: 0,
      boostsLimit: userProfile.is_premium ? 1 : 0, // Premium gets 1, free gets 0
      rewindsUsed: 0,
      rewindsLimit: userProfile.is_premium ? 999 : 0, // Premium gets unlimited, free gets 0
      lastResetDate: new Date(),
    }

    if (supabase) {
      await supabase.from("premium_usage").upsert({
        user_id: resetUsage.userId,
        super_likes_used: resetUsage.superLikesUsed,
        super_likes_limit: resetUsage.superLikesLimit,
        boosts_used: resetUsage.boostsUsed,
        boosts_limit: resetUsage.boostsLimit,
        rewinds_used: resetUsage.rewindsUsed,
        rewinds_limit: resetUsage.rewindsLimit,
        last_reset_date: resetUsage.lastResetDate.toISOString(),
      })
    }

    return resetUsage
  }

  private static async updatePremiumUsage(userId: string, updates: Partial<PremiumUsage>): Promise<void> {
    try {
      if (supabase) {
        const updateData: any = {}
        if (updates.superLikesUsed !== undefined) updateData.super_likes_used = updates.superLikesUsed
        if (updates.boostsUsed !== undefined) updateData.boosts_used = updates.boostsUsed
        if (updates.rewindsUsed !== undefined) updateData.rewinds_used = updates.rewindsUsed

        await supabase.from("premium_usage").update(updateData).eq("user_id", userId)
      }
    } catch (error) {
      console.error("Update premium usage error:", error)
    }
  }

  // Helper methods
  private static async getUserProfile(userId: string): Promise<any> {
    // This would normally fetch from your user database
    // For now, return mock data
    return {
      id: userId,
      is_premium: Math.random() > 0.7, // 30% chance of being premium for demo
    }
  }

  private static async getExistingSuperLike(userId: string, targetUserId: string): Promise<SuperLike | null> {
    try {
      if (supabase) {
        const { data } = await supabase
          .from("super_likes")
          .select("*")
          .eq("user_id", userId)
          .eq("target_user_id", targetUserId)
          .eq("is_active", true)
          .single()

        if (data) {
          return {
            id: data.id,
            userId: data.user_id,
            targetUserId: data.target_user_id,
            timestamp: new Date(data.timestamp),
            isActive: data.is_active,
          }
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  private static async getActiveBoost(userId: string): Promise<Boost | null> {
    try {
      if (supabase) {
        const { data } = await supabase
          .from("boosts")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .gte("end_time", new Date().toISOString())
          .single()

        if (data) {
          return {
            id: data.id,
            userId: data.user_id,
            startTime: new Date(data.start_time),
            endTime: new Date(data.end_time),
            isActive: data.is_active,
            viewsGenerated: data.views_generated,
            likesGenerated: data.likes_generated,
          }
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  private static async getLastSwipeAction(userId: string): Promise<any> {
    // Mock implementation - would fetch from swipe_actions table
    return {
      targetUserId: "user123",
      action: "pass" as const,
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    }
  }

  private static async getExistingRewind(userId: string, targetUserId: string): Promise<RewindAction | null> {
    try {
      if (supabase) {
        const { data } = await supabase
          .from("rewind_actions")
          .select("*")
          .eq("user_id", userId)
          .eq("target_user_id", targetUserId)
          .single()

        if (data) {
          return {
            id: data.id,
            userId: data.user_id,
            targetUserId: data.target_user_id,
            originalAction: data.original_action,
            timestamp: new Date(data.timestamp),
          }
        }
      }
      return null
    } catch (error) {
      return null
    }
  }

  private static async sendSuperLikeNotification(targetUserId: string, senderUserId: string): Promise<void> {
    // Implementation would send push notification
    console.log(`Sending super like notification to ${targetUserId} from ${senderUserId}`)
  }

  private static trackBoostPerformance(boostId: string): void {
    // Implementation would track boost performance metrics
    console.log(`Tracking boost performance for ${boostId}`)
  }
}
