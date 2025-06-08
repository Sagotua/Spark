export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export interface NotificationPreferences {
  matches: boolean
  messages: boolean
  likes: boolean
  superLikes: boolean
  profileViews: boolean
  promotions: boolean
  quietHours: {
    enabled: boolean
    start: string // "22:00"
    end: string // "08:00"
  }
}

export class PushNotificationService {
  private static isInitialized = false
  private static permission: NotificationPermission = "default"

  static async initialize(): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (!("Notification" in window)) {
        console.warn("Notifications not supported")
        return false
      }

      this.permission = Notification.permission
      this.isInitialized = true

      console.log("Push notifications initialized successfully")
      return true
    } catch (error) {
      console.error("Push notification initialization error:", error)
      return false
    }
  }

  static async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!("Notification" in window)) {
        console.warn("Notifications not supported")
        return "denied"
      }

      const permission = await Notification.requestPermission()
      this.permission = permission
      console.log("Notification permission:", permission)
      return permission
    } catch (error) {
      console.error("Permission request error:", error)
      return "denied"
    }
  }

  static async subscribe(userId: string): Promise<boolean> {
    try {
      if (this.permission !== "granted") {
        console.warn("Notification permission not granted")
        return false
      }

      // In a real app, you would register with your push service here
      // For demo purposes, we'll just store the user preference
      localStorage.setItem(`notifications_${userId}`, "subscribed")

      console.log("Push subscription successful for user:", userId)
      return true
    } catch (error) {
      console.error("Push subscription error:", error)
      return false
    }
  }

  static async unsubscribe(userId: string): Promise<boolean> {
    try {
      localStorage.removeItem(`notifications_${userId}`)
      console.log("Push unsubscription successful")
      return true
    } catch (error) {
      console.error("Push unsubscription error:", error)
      return false
    }
  }

  static async sendNotification(
    userId: string,
    payload: NotificationPayload,
    preferences?: NotificationPreferences,
  ): Promise<boolean> {
    try {
      // Check if user is subscribed
      const isSubscribed = localStorage.getItem(`notifications_${userId}`) === "subscribed"
      if (!isSubscribed) {
        console.log("User not subscribed to notifications")
        return false
      }

      // Check quiet hours
      if (preferences?.quietHours.enabled && this.isQuietHours(preferences.quietHours)) {
        console.log("Notification blocked: quiet hours")
        return false
      }

      await this.sendLocalNotification(payload)
      return true
    } catch (error) {
      console.error("Send notification error:", error)
      return false
    }
  }

  static async sendMatchNotification(matchedUser: { name: string; photo: string }): Promise<void> {
    const payload: NotificationPayload = {
      title: "🎉 It's a Match!",
      body: `You and ${matchedUser.name} liked each other`,
      icon: matchedUser.photo,
      tag: "match",
      data: {
        type: "match",
        userId: matchedUser.name,
      },
    }

    await this.sendLocalNotification(payload)
  }

  static async sendMessageNotification(sender: { name: string; photo: string }, message: string): Promise<void> {
    const payload: NotificationPayload = {
      title: sender.name,
      body: message.length > 50 ? `${message.substring(0, 50)}...` : message,
      icon: sender.photo,
      tag: `message-${sender.name}`,
      data: {
        type: "message",
        senderId: sender.name,
      },
    }

    await this.sendLocalNotification(payload)
  }

  static async sendLikeNotification(liker: { name: string; photo: string }): Promise<void> {
    const payload: NotificationPayload = {
      title: "Someone likes you! 💕",
      body: `${liker.name} liked your profile`,
      icon: liker.photo,
      tag: "like",
      data: {
        type: "like",
        userId: liker.name,
      },
    }

    await this.sendLocalNotification(payload)
  }

  private static async sendLocalNotification(payload: NotificationPayload): Promise<void> {
    try {
      if (this.permission === "granted" && this.isInitialized) {
        // Create and show notification
        const notification = new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || "/placeholder.svg?height=64&width=64",
          tag: payload.tag,
          data: payload.data,
          requireInteraction: false,
        })

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close()
        }, 5000)

        // Handle click events
        notification.onclick = (event) => {
          event.preventDefault()
          notification.close()

          // Focus the window
          if (window) {
            window.focus()
          }

          // Handle navigation based on notification type
          const data = payload.data
          if (data?.type === "match") {
            console.log("Navigate to matches")
          } else if (data?.type === "message") {
            console.log("Navigate to chats")
          } else if (data?.type === "like") {
            console.log("Navigate to likes")
          }
        }

        console.log("Local notification sent:", payload.title)
      } else {
        console.warn("Cannot send notification: permission not granted or not initialized")
      }
    } catch (error) {
      console.error("Local notification error:", error)
    }
  }

  private static isQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    const start = quietHours.start
    const end = quietHours.end

    if (start <= end) {
      return currentTime >= start && currentTime <= end
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= start || currentTime <= end
    }
  }

  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const stored = localStorage.getItem(`notification_preferences_${userId}`)
      if (stored) {
        return JSON.parse(stored)
      }
      return this.getDefaultPreferences()
    } catch (error) {
      console.error("Get notification preferences error:", error)
      return this.getDefaultPreferences()
    }
  }

  static async updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void> {
    try {
      localStorage.setItem(`notification_preferences_${userId}`, JSON.stringify(preferences))
    } catch (error) {
      console.error("Update notification preferences error:", error)
    }
  }

  private static getDefaultPreferences(): NotificationPreferences {
    return {
      matches: true,
      messages: true,
      likes: true,
      superLikes: true,
      profileViews: false,
      promotions: false,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00",
      },
    }
  }

  static getPermissionStatus(): NotificationPermission {
    return this.permission
  }

  static isSupported(): boolean {
    return "Notification" in window
  }
}
