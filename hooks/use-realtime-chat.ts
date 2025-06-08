"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Message } from "@/lib/supabase"

export function useRealtimeChat(matchId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        if (!supabase) {
          // Mock messages for demo
          setMessages([])
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("match_id", matchId)
          .order("created_at", { ascending: true })

        if (error) throw error
        setMessages(data || [])
      } catch (error) {
        console.error("Load messages error:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [matchId])

  // Set up real-time subscription
  useEffect(() => {
    if (!supabase) return

    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
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
          setMessages((prev) => prev.map((msg) => (msg.id === payload.new.id ? (payload.new as Message) : msg)))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId])

  const sendMessage = useCallback(
    async (content: string, senderId: string, messageType: "text" | "image" | "video" | "audio" = "text") => {
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
          setMessages((prev) => [...prev, mockMessage])
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
        return data
      } catch (error) {
        console.error("Send message error:", error)
        throw error
      }
    },
    [matchId],
  )

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      if (!supabase) return

      await supabase.from("messages").update({ is_read: true }).eq("id", messageId)
    } catch (error) {
      console.error("Mark as read error:", error)
    }
  }, [])

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
  }
}
