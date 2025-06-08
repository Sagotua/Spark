import { supabase, mockUsers } from "./supabase"

// Types
export interface UserStats {
  userId: string
  level: number
  xp: number
  hearts: number
  achievements: Achievement[]
  challenges: Challenge[]
  streaks: {
    login: number
    challenge: number
  }
  points: {
    total: number
    today: number
    week: number
  }
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  tier: "bronze" | "silver" | "gold" | "platinum"
  progress: number
  maxProgress: number
  completed: boolean
  completedAt?: Date
}

export interface Challenge {
  id: string
  name: string
  description: string
  icon: string
  points: number
  progress: number
  maxProgress: number
  completed: boolean
  expiresAt: Date
}

export interface LeaderboardEntry {
  userId: string
  name: string
  photo: string
  points: number
  level: number
  rank: number
}

export interface Reward {
  id: string
  name: string
  description: string
  icon: string
  cost: number
  category: string
  available: boolean
  premium: boolean
}

// Mock data for development
const mockAchievements: Achievement[] = [
  {
    id: "first-match",
    name: "First Match",
    description: "Get your first match",
    icon: "heart",
    category: "matches",
    tier: "bronze",
    progress: 1,
    maxProgress: 1,
    completed: true,
    completedAt: new Date(),
  },
  {
    id: "conversation-starter",
    name: "Conversation Starter",
    description: "Send your first message",
    icon: "message-circle",
    category: "messages",
    tier: "bronze",
    progress: 1,
    maxProgress: 1,
    completed: true,
    completedAt: new Date(),
  },
  {
    id: "profile-complete",
    name: "Profile Pro",
    description: "Complete your profile 100%",
    icon: "user-check",
    category: "profile",
    tier: "bronze",
    progress: 85,
    maxProgress: 100,
    completed: false,
  },
  {
    id: "match-maker",
    name: "Match Maker",
    description: "Get 10 matches",
    icon: "users",
    category: "matches",
    tier: "silver",
    progress: 3,
    maxProgress: 10,
    completed: false,
  },
  {
    id: "chatty",
    name: "Chatty",
    description: "Send 50 messages",
    icon: "message-square",
    category: "messages",
    tier: "silver",
    progress: 12,
    maxProgress: 50,
    completed: false,
  },
]

const mockChallenges: Challenge[] = [
  {
    id: "daily-swipe",
    name: "Swipe Right",
    description: "Swipe right on 10 profiles today",
    icon: "thumbs-up",
    points: 50,
    progress: 3,
    maxProgress: 10,
    completed: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    id: "daily-message",
    name: "Message Match",
    description: "Send a message to 3 matches",
    icon: "send",
    points: 75,
    progress: 1,
    maxProgress: 3,
    completed: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    id: "update-profile",
    name: "Fresh Look",
    description: "Update your profile photo",
    icon: "camera",
    points: 100,
    progress: 0,
    maxProgress: 1,
    completed: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
]

const mockRewards: Reward[] = [
  {
    id: "boost-1",
    name: "Profile Boost",
    description: "Be the top profile in your area for 30 minutes",
    icon: "zap",
    cost: 200,
    category: "boost",
    available: true,
    premium: false,
  },
  {
    id: "super-like-5",
    name: "5 Super Likes",
    description: "Get noticed with 5 Super Likes",
    icon: "star",
    cost: 150,
    category: "likes",
    available: true,
    premium: false,
  },
  {
    id: "read-receipts",
    name: "Read Receipts (1 week)",
    description: "See when your messages are read for 1 week",
    icon: "check-circle",
    cost: 300,
    category: "premium",
    available: true,
    premium: true,
  },
]

// Gamification Service
export const GamificationService = {
  // Initialize user gamification data
  async initializeUser(userId: string): Promise<void> {
    try {
      // Check if user exists in database
      const { data, error } = await supabase.from("user_gamification").select("*").eq("user_id", userId).single()

      if (error || !data) {
        // Create new user stats
        await supabase.from("user_gamification").insert({
          user_id: userId,
          level: 1,
          xp: 0,
          hearts: 100, // Starting hearts
          login_streak: 1,
          challenge_streak: 0,
          total_points: 0,
          daily_points: 0,
          weekly_points: 0,
          last_login: new Date().toISOString(),
        })

        // Generate initial challenges
        await this.generateDailyChallenges(userId)
      } else {
        // Update login streak
        const lastLogin = new Date(data.last_login)
        const today = new Date()
        const diffDays = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))

        let loginStreak = data.login_streak
        if (diffDays === 1) {
          // Consecutive day
          loginStreak += 1
        } else if (diffDays > 1) {
          // Streak broken
          loginStreak = 1
        }

        // Update last login and streak
        await supabase
          .from("user_gamification")
          .update({
            login_streak: loginStreak,
            last_login: today.toISOString(),
          })
          .eq("user_id", userId)

        // Check if we need to generate new daily challenges
        const { data: challenges } = await supabase
          .from("user_challenges")
          .select("*")
          .eq("user_id", userId)
          .gt("expires_at", today.toISOString())

        if (!challenges || challenges.length === 0) {
          await this.generateDailyChallenges(userId)
        }
      }
    } catch (error) {
      console.error("Error initializing user gamification:", error)
      // Fallback to mock data
    }
  },

  // Get user stats
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Get user gamification data
      const { data: userData, error: userError } = await supabase
        .from("user_gamification")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (userError || !userData) {
        throw new Error("User gamification data not found")
      }

      // Get user achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId)

      // Get user challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString())

      return {
        userId,
        level: userData.level,
        xp: userData.xp,
        hearts: userData.hearts,
        achievements: achievementsData || mockAchievements,
        challenges: challengesData || mockChallenges,
        streaks: {
          login: userData.login_streak,
          challenge: userData.challenge_streak,
        },
        points: {
          total: userData.total_points,
          today: userData.daily_points,
          week: userData.weekly_points,
        },
      }
    } catch (error) {
      console.error("Error getting user stats:", error)
      // Return mock data for development
      return {
        userId,
        level: 3,
        xp: 750,
        hearts: 350,
        achievements: mockAchievements,
        challenges: mockChallenges,
        streaks: {
          login: 5,
          challenge: 3,
        },
        points: {
          total: 1250,
          today: 125,
          week: 450,
        },
      }
    }
  },

  // Award points for actions
  async awardPoints(userId: string, action: string, points: number): Promise<void> {
    try {
      // Get current user stats
      const { data, error } = await supabase.from("user_gamification").select("*").eq("user_id", userId).single()

      if (error || !data) {
        throw new Error("User gamification data not found")
      }

      // Calculate new values
      const totalPoints = data.total_points + points
      const dailyPoints = data.daily_points + points
      const weeklyPoints = data.weekly_points + points
      const hearts = data.hearts + Math.floor(points / 10) // 1 heart per 10 points
      const xp = data.xp + points
      const level = this.calculateLevel(xp)

      // Update user stats
      await supabase
        .from("user_gamification")
        .update({
          total_points: totalPoints,
          daily_points: dailyPoints,
          weekly_points: weeklyPoints,
          hearts: hearts,
          xp: xp,
          level: level,
        })
        .eq("user_id", userId)

      // Record action
      await supabase.from("user_actions").insert({
        user_id: userId,
        action_type: action,
        points: points,
        created_at: new Date().toISOString(),
      })

      // Check for achievements
      await this.checkAchievements(userId, action)

      // Check for challenge progress
      await this.updateChallengeProgress(userId, action)
    } catch (error) {
      console.error("Error awarding points:", error)
    }
  },

  // Calculate level based on XP
  calculateLevel(xp: number): number {
    // Simple level calculation: level = sqrt(xp / 100)
    return Math.max(1, Math.floor(Math.sqrt(xp / 100)))
  },

  // Generate daily challenges
  async generateDailyChallenges(userId: string): Promise<void> {
    try {
      // Delete existing challenges
      await supabase.from("user_challenges").delete().eq("user_id", userId)

      // Create expiration date (end of day)
      const expiresAt = new Date()
      expiresAt.setHours(23, 59, 59, 999)

      // Create new challenges
      const challenges = [
        {
          user_id: userId,
          challenge_id: "daily-swipe",
          name: "Swipe Right",
          description: "Swipe right on 10 profiles today",
          icon: "thumbs-up",
          points: 50,
          progress: 0,
          max_progress: 10,
          completed: false,
          expires_at: expiresAt.toISOString(),
        },
        {
          user_id: userId,
          challenge_id: "daily-message",
          name: "Message Match",
          description: "Send a message to 3 matches",
          icon: "send",
          points: 75,
          progress: 0,
          max_progress: 3,
          completed: false,
          expires_at: expiresAt.toISOString(),
        },
        {
          user_id: userId,
          challenge_id: "update-profile",
          name: "Fresh Look",
          description: "Update your profile photo",
          icon: "camera",
          points: 100,
          progress: 0,
          max_progress: 1,
          completed: false,
          expires_at: expiresAt.toISOString(),
        },
      ]

      await supabase.from("user_challenges").insert(challenges)
    } catch (error) {
      console.error("Error generating daily challenges:", error)
    }
  },

  // Update challenge progress
  async updateChallengeProgress(userId: string, action: string): Promise<void> {
    try {
      let challengeId = ""
      const progressIncrement = 1

      // Map action to challenge
      switch (action) {
        case "swipe_right":
          challengeId = "daily-swipe"
          break
        case "message":
          challengeId = "daily-message"
          break
        case "update_photo":
          challengeId = "update-profile"
          break
        default:
          return // No matching challenge
      }

      // Get current challenge
      const { data, error } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)
        .single()

      if (error || !data || data.completed) {
        return // Challenge not found or already completed
      }

      // Update progress
      const newProgress = Math.min(data.progress + progressIncrement, data.max_progress)
      const completed = newProgress >= data.max_progress

      // Update challenge
      await supabase
        .from("user_challenges")
        .update({
          progress: newProgress,
          completed: completed,
        })
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)

      // Award points if completed
      if (completed) {
        await this.awardPoints(userId, "challenge_complete", data.points)

        // Update challenge streak
        const { data: userData } = await supabase
          .from("user_gamification")
          .select("challenge_streak")
          .eq("user_id", userId)
          .single()

        if (userData) {
          await supabase
            .from("user_gamification")
            .update({
              challenge_streak: userData.challenge_streak + 1,
            })
            .eq("user_id", userId)
        }
      }
    } catch (error) {
      console.error("Error updating challenge progress:", error)
    }
  },

  // Check for achievements
  async checkAchievements(userId: string, action: string): Promise<void> {
    try {
      // Get action counts
      const { data: actionCounts, error: actionError } = await supabase
        .from("user_actions")
        .select("action_type, count(*)")
        .eq("user_id", userId)
        .group("action_type")

      if (actionError || !actionCounts) {
        return
      }

      // Map of action types to achievement IDs and thresholds
      const achievementMap: Record<string, { id: string; thresholds: number[] }> = {
        match: {
          id: "match",
          thresholds: [1, 10, 50, 100], // Bronze, Silver, Gold, Platinum
        },
        message: {
          id: "message",
          thresholds: [1, 50, 250, 1000],
        },
        swipe_right: {
          id: "swipe",
          thresholds: [10, 100, 500, 1000],
        },
        update_photo: {
          id: "profile",
          thresholds: [1, 5, 10, 20],
        },
      }

      // Check each action type
      for (const actionType in achievementMap) {
        const actionCount = actionCounts.find((a) => a.action_type === actionType)?.count || 0
        const achievement = achievementMap[actionType]

        // Check each threshold
        for (let i = 0; i < achievement.thresholds.length; i++) {
          const threshold = achievement.thresholds[i]
          const tier = ["bronze", "silver", "gold", "platinum"][i]
          const achievementId = `${achievement.id}-${tier}`

          if (actionCount >= threshold) {
            // Check if achievement already exists
            const { data: existingAchievement } = await supabase
              .from("user_achievements")
              .select("*")
              .eq("user_id", userId)
              .eq("achievement_id", achievementId)
              .single()

            if (!existingAchievement) {
              // Award new achievement
              await supabase.from("user_achievements").insert({
                user_id: userId,
                achievement_id: achievementId,
                name: `${this.capitalizeFirstLetter(actionType)} ${this.capitalizeFirstLetter(tier)}`,
                description: `${this.getAchievementDescription(actionType, threshold)}`,
                icon: this.getAchievementIcon(actionType),
                category: actionType,
                tier: tier,
                progress: actionCount,
                max_progress: threshold,
                completed: true,
                completed_at: new Date().toISOString(),
              })

              // Award points for achievement
              const points = this.getAchievementPoints(tier)
              await this.awardPoints(userId, "achievement", points)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking achievements:", error)
    }
  },

  // Get leaderboard
  async getLeaderboard(
    userId: string,
    type: "global" | "local" | "friends" = "global",
    timeframe: "daily" | "weekly" | "all-time" = "weekly",
    limit = 10,
  ): Promise<LeaderboardEntry[]> {
    try {
      let pointsColumn = "total_points"
      if (timeframe === "daily") pointsColumn = "daily_points"
      if (timeframe === "weekly") pointsColumn = "weekly_points"

      // Get leaderboard data
      const { data, error } = await supabase
        .from("user_gamification")
        .select(`user_id, ${pointsColumn}, level`)
        .order(pointsColumn, { ascending: false })
        .limit(limit)

      if (error || !data) {
        throw new Error("Error fetching leaderboard")
      }

      // Get user details
      const userIds = data.map((entry) => entry.user_id)
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name, photos")
        .in("id", userIds)

      if (usersError || !users) {
        throw new Error("Error fetching user details")
      }

      // Combine data
      const leaderboard = data.map((entry, index) => {
        const user = users.find((u) => u.id === entry.user_id)
        return {
          userId: entry.user_id,
          name: user?.name || "Unknown User",
          photo: user?.photos?.[0] || "/placeholder.svg",
          points: entry[pointsColumn as keyof typeof entry] as number,
          level: entry.level,
          rank: index + 1,
        }
      })

      return leaderboard
    } catch (error) {
      console.error("Error getting leaderboard:", error)
      // Return mock data for development
      return mockUsers
        .slice(0, limit)
        .map((user, index) => ({
          userId: user.id,
          name: user.name,
          photo: user.photos[0] || "/placeholder.svg",
          points: 1000 - index * 50 + Math.floor(Math.random() * 30),
          level: 10 - Math.floor(index / 2),
          rank: index + 1,
        }))
        .sort((a, b) => b.points - a.points)
    }
  },

  // Get available rewards
  async getRewards(userId: string): Promise<Reward[]> {
    try {
      // Get rewards from database
      const { data, error } = await supabase.from("rewards").select("*")

      if (error || !data) {
        throw new Error("Error fetching rewards")
      }

      // Get user's premium status
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("is_premium")
        .eq("id", userId)
        .single()

      const isPremium = userData?.is_premium || false

      // Filter rewards based on premium status
      return data
        .map((reward) => ({
          id: reward.id,
          name: reward.name,
          description: reward.description,
          icon: reward.icon,
          cost: reward.cost,
          category: reward.category,
          available: !reward.premium_only || isPremium,
          premium: reward.premium_only,
        }))
        .filter((reward) => reward.available || reward.premium)
    } catch (error) {
      console.error("Error getting rewards:", error)
      // Return mock data for development
      return mockRewards
    }
  },

  // Purchase reward
  async purchaseReward(userId: string, rewardId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from("rewards")
        .select("*")
        .eq("id", rewardId)
        .single()

      if (rewardError || !reward) {
        return { success: false, message: "Reward not found" }
      }

      // Get user hearts
      const { data: userData, error: userError } = await supabase
        .from("user_gamification")
        .select("hearts")
        .eq("user_id", userId)
        .single()

      if (userError || !userData) {
        return { success: false, message: "User data not found" }
      }

      // Check if user has enough hearts
      if (userData.hearts < reward.cost) {
        return { success: false, message: "Not enough hearts" }
      }

      // Check premium requirements
      if (reward.premium_only) {
        const { data: premiumData, error: premiumError } = await supabase
          .from("users")
          .select("is_premium")
          .eq("id", userId)
          .single()

        if (premiumError || !premiumData || !premiumData.is_premium) {
          return { success: false, message: "Premium subscription required" }
        }
      }

      // Deduct hearts
      await supabase
        .from("user_gamification")
        .update({
          hearts: userData.hearts - reward.cost,
        })
        .eq("user_id", userId)

      // Record purchase
      await supabase.from("user_rewards").insert({
        user_id: userId,
        reward_id: rewardId,
        cost: reward.cost,
        purchased_at: new Date().toISOString(),
      })

      // Apply reward effect
      await this.applyRewardEffect(userId, reward)

      return { success: true, message: `Successfully purchased ${reward.name}!` }
    } catch (error) {
      console.error("Error purchasing reward:", error)
      return { success: false, message: "An error occurred" }
    }
  },

  // Apply reward effect
  async applyRewardEffect(userId: string, reward: any): Promise<void> {
    try {
      switch (reward.category) {
        case "boost":
          // Apply profile boost
          await supabase.from("user_boosts").insert({
            user_id: userId,
            boost_type: reward.id,
            starts_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
          })
          break

        case "likes":
          // Add super likes
          const likeCount = Number.parseInt(reward.id.split("-")[2]) || 5
          await supabase.from("user_super_likes").insert({
            user_id: userId,
            count: likeCount,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          })
          break

        case "premium":
          // Add temporary premium feature
          const durationDays = 7 // 1 week
          await supabase.from("user_premium_features").insert({
            user_id: userId,
            feature_id: reward.id,
            expires_at: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
          })
          break

        default:
          break
      }
    } catch (error) {
      console.error("Error applying reward effect:", error)
    }
  },

  // Helper methods
  capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1)
  },

  getAchievementDescription(actionType: string, threshold: number): string {
    switch (actionType) {
      case "match":
        return `Get ${threshold} matches`
      case "message":
        return `Send ${threshold} messages`
      case "swipe_right":
        return `Swipe right ${threshold} times`
      case "update_photo":
        return `Update your profile photos ${threshold} times`
      default:
        return `Complete ${threshold} actions`
    }
  },

  getAchievementIcon(actionType: string): string {
    switch (actionType) {
      case "match":
        return "heart"
      case "message":
        return "message-circle"
      case "swipe_right":
        return "thumbs-up"
      case "update_photo":
        return "camera"
      default:
        return "award"
    }
  },

  getAchievementPoints(tier: string): number {
    switch (tier) {
      case "bronze":
        return 100
      case "silver":
        return 250
      case "gold":
        return 500
      case "platinum":
        return 1000
      default:
        return 50
    }
  },
}
