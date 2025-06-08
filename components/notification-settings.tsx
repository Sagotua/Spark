"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Bell, Clock, Heart, MessageCircle, Star, Eye, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PushNotificationService, type NotificationPreferences } from "@/lib/push-notifications"

interface NotificationSettingsProps {
  userId: string
  onBack: () => void
}

export default function NotificationSettings({ userId, onBack }: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
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
  })
  const [isLoading, setIsLoading] = useState(true)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default")
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    loadPreferences()
    checkNotificationSupport()
  }, [userId])

  const loadPreferences = async () => {
    try {
      const prefs = await PushNotificationService.getNotificationPreferences(userId)
      setPreferences(prefs)
    } catch (error) {
      console.error("Failed to load notification preferences:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkNotificationSupport = () => {
    const supported = PushNotificationService.isSupported()
    const permission = PushNotificationService.getPermissionStatus()

    setIsSupported(supported)
    setPermissionStatus(permission)
  }

  const handlePermissionRequest = async () => {
    try {
      const permission = await PushNotificationService.requestPermission()
      setPermissionStatus(permission)

      if (permission === "granted") {
        await PushNotificationService.subscribe(userId)

        // Send test notification
        await PushNotificationService.sendNotification(
          userId,
          {
            title: "Notifications Enabled! 🎉",
            body: "You'll now receive updates about matches, messages, and more.",
            tag: "welcome",
          },
          preferences,
        )
      }
    } catch (error) {
      console.error("Failed to request notification permission:", error)
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean | object) => {
    try {
      const newPreferences = { ...preferences, [key]: value }
      setPreferences(newPreferences)
      await PushNotificationService.updateNotificationPreferences(userId, newPreferences)
    } catch (error) {
      console.error("Failed to update notification preference:", error)
    }
  }

  const updateQuietHours = async (field: "enabled" | "start" | "end", value: boolean | string) => {
    try {
      const newQuietHours = { ...preferences.quietHours, [field]: value }
      const newPreferences = { ...preferences, quietHours: newQuietHours }
      setPreferences(newPreferences)
      await PushNotificationService.updateNotificationPreferences(userId, newPreferences)
    } catch (error) {
      console.error("Failed to update quiet hours:", error)
    }
  }

  const testNotification = async () => {
    try {
      await PushNotificationService.sendNotification(
        userId,
        {
          title: "Test Notification 🔔",
          body: "This is how your notifications will look!",
          tag: "test",
        },
        preferences,
      )
    } catch (error) {
      console.error("Failed to send test notification:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">Notification Settings</h1>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">Notification Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Permission Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Permission
            </CardTitle>
            <CardDescription>
              {!isSupported
                ? "Notifications are not supported in this browser"
                : permissionStatus === "granted"
                  ? "Notifications are enabled"
                  : permissionStatus === "denied"
                    ? "Notifications are blocked"
                    : "Notifications are not enabled"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSupported && permissionStatus !== "granted" && (
              <Button onClick={handlePermissionRequest} className="w-full">
                <Bell className="h-4 w-4 mr-2" />
                Enable Notifications
              </Button>
            )}
            {isSupported && permissionStatus === "granted" && (
              <Button onClick={testNotification} variant="outline" className="w-full">
                <Bell className="h-4 w-4 mr-2" />
                Send Test Notification
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Notification Types */}
        {permissionStatus === "granted" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-pink-500" />
                    <div>
                      <Label htmlFor="matches">New Matches</Label>
                      <p className="text-sm text-gray-500">When someone likes you back</p>
                    </div>
                  </div>
                  <Switch
                    id="matches"
                    checked={preferences.matches}
                    onCheckedChange={(checked) => updatePreference("matches", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <div>
                      <Label htmlFor="messages">New Messages</Label>
                      <p className="text-sm text-gray-500">When you receive a message</p>
                    </div>
                  </div>
                  <Switch
                    id="messages"
                    checked={preferences.messages}
                    onCheckedChange={(checked) => updatePreference("messages", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <Label htmlFor="likes">New Likes</Label>
                      <p className="text-sm text-gray-500">When someone likes your profile</p>
                    </div>
                  </div>
                  <Switch
                    id="likes"
                    checked={preferences.likes}
                    onCheckedChange={(checked) => updatePreference("likes", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <Label htmlFor="superLikes">Super Likes</Label>
                      <p className="text-sm text-gray-500">When someone super likes you</p>
                    </div>
                  </div>
                  <Switch
                    id="superLikes"
                    checked={preferences.superLikes}
                    onCheckedChange={(checked) => updatePreference("superLikes", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-purple-500" />
                    <div>
                      <Label htmlFor="profileViews">Profile Views</Label>
                      <p className="text-sm text-gray-500">When someone views your profile</p>
                    </div>
                  </div>
                  <Switch
                    id="profileViews"
                    checked={preferences.profileViews}
                    onCheckedChange={(checked) => updatePreference("profileViews", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-green-500" />
                    <div>
                      <Label htmlFor="promotions">Promotions</Label>
                      <p className="text-sm text-gray-500">Special offers and updates</p>
                    </div>
                  </div>
                  <Switch
                    id="promotions"
                    checked={preferences.promotions}
                    onCheckedChange={(checked) => updatePreference("promotions", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Quiet Hours
                </CardTitle>
                <CardDescription>Set times when you don't want to receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quietHours">Enable Quiet Hours</Label>
                  <Switch
                    id="quietHours"
                    checked={preferences.quietHours.enabled}
                    onCheckedChange={(checked) => updateQuietHours("enabled", checked)}
                  />
                </div>

                {preferences.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Select
                        value={preferences.quietHours.start}
                        onValueChange={(value) => updateQuietHours("start", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, "0")
                            return (
                              <SelectItem key={hour} value={`${hour}:00`}>
                                {hour}:00
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Select
                        value={preferences.quietHours.end}
                        onValueChange={(value) => updateQuietHours("end", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => {
                            const hour = i.toString().padStart(2, "0")
                            return (
                              <SelectItem key={hour} value={`${hour}:00`}>
                                {hour}:00
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
