import { supabase } from "@/lib/supabase"

export interface ActivityItem {
  id: string
  type: "profile_view" | "like" | "super_like" | "match" | "story_view" | "story_reaction"
  actorId: string
  actorName: string
  actorPhoto: string
  targetId: string
  timestamp: Date
  metadata?: {
    storyId?: string
    reactionType?: string
    isRecent?: boolean
  }
}

export interface ProfileBadge {
  id: string
  type: "verified" | "popular" | "new_user" | "premium" | "top_pick" | "recently_active"
  label: string
  icon: string
  color: string
  description: string
}

export class ActivityFeedService {
  private static activities: ActivityItem[] = []

  static async recordActivity(activity: Omit<ActivityItem, "id" | "timestamp">): Promise<void> {
    const newActivity: ActivityItem = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date(),
    }

    this.activities.unshift(newActivity)

    // Keep only last 1000 activities
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(0, 1000)
    }

    // In production, save to database
    if (supabase) {
      await supabase.from("activities").insert({
        type: activity.type,
        actor_id: activity.actorId,
        target_id: activity.targetId,
        metadata: activity.metadata,
      })
    }
  }

  static async getUserActivity(userId: string, limit = 50): Promise<ActivityItem[]> {
    if (!supabase) {
      return this.activities.filter((a) => a.targetId === userId).slice(0, limit)
    }

    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("target_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Get user activity error:", error)
      return []
    }
  }

  static async getRecentProfileViews(userId: string): Promise<ActivityItem[]> {
    const activities = await this.getUserActivity(userId, 100)
    return activities.filter((a) => a.type === "profile_view" && this.isRecent(a.timestamp))
  }

  static async getRecentLikes(userId: string): Promise<ActivityItem[]> {
    const activities = await this.getUserActivity(userId, 100)
    return activities.filter((a) => ["like", "super_like"].includes(a.type) && this.isRecent(a.timestamp))
  }

  static getUserBadges(user: any): ProfileBadge[] {
    const badges: ProfileBadge[] = []

    if (user.is_verified) {
      badges.push({
        id: "verified",
        type: "verified",
        label: "Verified",
        icon: "✓",
        color: "text-blue-500",
        description: "Identity verified",
      })
    }

    if (user.is_premium) {
      badges.push({
        id: "premium",
        type: "premium",
        label: "Premium",
        icon: "👑",
        color: "text-purple-500",
        description: "Premium member",
      })
    }

    // Check if user is new (created within last 7 days)
    const createdAt = new Date(user.created_at)
    const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreated <= 7) {
      badges.push({
        id: "new_user",
        type: "new_user",
        label: "New",
        icon: "✨",
        color: "text-green-500",
        description: "New to the app",
      })
    }

    // Check if recently active (last 24 hours)
    const lastActive = new Date(user.last_active)
    const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60)
    if (hoursSinceActive <= 24) {
      badges.push({
        id: "recently_active",
        type: "recently_active",
        label: "Active",
        icon: "🟢",
        color: "text-green-500",
        description: "Recently active",
      })
    }

    // Mock popular badge (in real app, based on likes/matches)
    if (Math.random() > 0.7) {
      badges.push({
        id: "popular",
        type: "popular",
        label: "Popular",
        icon: "🔥",
        color: "text-orange-500",
        description: "Popular in your area",
      })
    }

    return badges
  }

  private static isRecent(timestamp: Date): boolean {
    const hoursSince = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60)
    return hoursSince <= 24 // Last 24 hours
  }

  static getActivitySummary(activities: ActivityItem[]) {
    const last24Hours = activities.filter((a) => this.isRecent(a.timestamp))

    return {
      totalViews: activities.filter((a) => a.type === "profile_view").length,
      totalLikes: activities.filter((a) => ["like", "super_like"].includes(a.type)).length,
      recentViews: last24Hours.filter((a) => a.type === "profile_view").length,
      recentLikes: last24Hours.filter((a) => ["like", "super_like"].includes(a.type)).length,
      storyViews: activities.filter((a) => a.type === "story_view").length,
      storyReactions: activities.filter((a) => a.type === "story_reaction").length,
    }
  }
}
