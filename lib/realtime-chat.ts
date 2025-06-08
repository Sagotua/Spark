import { supabase } from "./supabase"
import type { Message } from "./supabase"

export interface ChatMessage extends Message {
  user_name?: string
  user_photo?: string
}

export interface TypingStatus {
  userId: string
  userName: string
  isTyping: boolean
  timestamp: Date
}

export class RealtimeChatService {
  private static channels: Map<string, any> = new Map()
  private static typingTimeouts: Map<string, NodeJS.Timeout> = new Map()

  static async initializeChat(matchId: string, currentUserId: string) {
    if (!supabase) return null

    // Create or get existing channel
    const channelName = `chat-${matchId}`

    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          this.handleNewMessage(payload.new as Message, matchId)
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          this.handleMessageUpdate(payload.new as Message, matchId)
        },
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        this.handleTypingStatus(payload.payload as TypingStatus, matchId, currentUserId)
      })
      .on("presence", { event: "sync" }, () => {
        this.handlePresenceSync(matchId)
      })
      .subscribe()

    this.channels.set(channelName, channel)
    return channel
  }

  static async sendMessage(
    matchId: string,
    senderId: string,
    content: string,
    messageType: "text" | "image" | "video" | "audio" = "text",
  ): Promise<Message | null> {
    try {
      if (!supabase) {
        // Mock message for demo
        const mockMessage: Message = {
          id: Date.now().toString(),
          match_id: matchId,
          sender_id: senderId,
          content,
          message_type: messageType,
          is_read: false,
          created_at: new Date().toISOString(),
        }
        return mockMessage
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          match_id: matchId,
          sender_id: senderId,
          content,
          message_type: messageType,
        })
        .select()
        .single()

      if (error) throw error

      // Stop typing indicator
      this.stopTyping(matchId, senderId)

      return data
    } catch (error) {
      console.error("Send message error:", error)
      throw error
    }
  }

  static async markMessagesAsRead(matchId: string, userId: string) {
    try {
      if (!supabase) return

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("match_id", matchId)
        .neq("sender_id", userId)
        .eq("is_read", false)
    } catch (error) {
      console.error("Mark messages as read error:", error)
    }
  }

  static async startTyping(matchId: string, userId: string, userName: string) {
    const channelName = `chat-${matchId}`
    const channel = this.channels.get(channelName)

    if (channel) {
      await channel.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId,
          userName,
          isTyping: true,
          timestamp: new Date(),
        },
      })

      // Clear existing timeout
      const timeoutKey = `${matchId}-${userId}`
      if (this.typingTimeouts.has(timeoutKey)) {
        clearTimeout(this.typingTimeouts.get(timeoutKey))
      }

      // Auto-stop typing after 3 seconds
      const timeout = setTimeout(() => {
        this.stopTyping(matchId, userId)
      }, 3000)

      this.typingTimeouts.set(timeoutKey, timeout)
    }
  }

  static async stopTyping(matchId: string, userId: string) {
    const channelName = `chat-${matchId}`
    const channel = this.channels.get(channelName)

    if (channel) {
      await channel.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId,
          userName: "",
          isTyping: false,
          timestamp: new Date(),
        },
      })
    }

    // Clear timeout
    const timeoutKey = `${matchId}-${userId}`
    if (this.typingTimeouts.has(timeoutKey)) {
      clearTimeout(this.typingTimeouts.get(timeoutKey))
      this.typingTimeouts.delete(timeoutKey)
    }
  }

  static async trackPresence(matchId: string, userId: string, userName: string) {
    const channelName = `chat-${matchId}`
    const channel = this.channels.get(channelName)

    if (channel) {
      await channel.track({
        user_id: userId,
        user_name: userName,
        online_at: new Date().toISOString(),
      })
    }
  }

  static async untrackPresence(matchId: string) {
    const channelName = `chat-${matchId}`
    const channel = this.channels.get(channelName)

    if (channel) {
      await channel.untrack()
    }
  }

  static cleanup(matchId: string) {
    const channelName = `chat-${matchId}`
    const channel = this.channels.get(channelName)

    if (channel && supabase) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }

    // Clear any typing timeouts
    this.typingTimeouts.forEach((timeout, key) => {
      if (key.startsWith(`${matchId}-`)) {
        clearTimeout(timeout)
        this.typingTimeouts.delete(key)
      }
    })
  }

  private static handleNewMessage(message: Message, matchId: string) {
    // Emit custom event for components to listen to
    window.dispatchEvent(
      new CustomEvent("newMessage", {
        detail: { message, matchId },
      }),
    )
  }

  private static handleMessageUpdate(message: Message, matchId: string) {
    window.dispatchEvent(
      new CustomEvent("messageUpdate", {
        detail: { message, matchId },
      }),
    )
  }

  private static handleTypingStatus(status: TypingStatus, matchId: string, currentUserId: string) {
    // Don't show typing indicator for current user
    if (status.userId === currentUserId) return

    window.dispatchEvent(
      new CustomEvent("typingStatus", {
        detail: { status, matchId },
      }),
    )
  }

  private static handlePresenceSync(matchId: string) {
    window.dispatchEvent(
      new CustomEvent("presenceSync", {
        detail: { matchId },
      }),
    )
  }
}
