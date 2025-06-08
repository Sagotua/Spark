"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Trophy, Star, Heart, MessageCircle, Camera, Users, Award } from "lucide-react"
import { GamificationService, type Achievement } from "@/lib/gamification-system"

interface AchievementsScreenProps {
  userId: string
  onBack: () => void
}

export default function AchievementsScreen({ userId, onBack }: AchievementsScreenProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAchievements()
  }, [userId])

  const loadAchievements = async () => {
    try {
      setLoading(true)
      const userStats = await GamificationService.getUserStats(userId)
      setAchievements(userStats.achievements)
    } catch (error) {
      console.error("Error loading achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { id: "all", name: "All", icon: Award },
    { id: "matches", name: "Dating", icon: Heart },
    { id: "messages", name: "Social", icon: MessageCircle },
    { id: "profile", name: "Profile", icon: Camera },
    { id: "premium", name: "Premium", icon: Star },
  ]

  const filteredAchievements = achievements.filter(
    (achievement) => selectedCategory === "all" || achievement.category === selectedCategory,
  )

  const completedCount = achievements.filter((a) => a.completed).length
  const totalCount = achievements.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "bronze":
        return "bg-amber-100 text-amber-800 border-amber-300"
      case "silver":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "gold":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "platinum":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "heart":
        return <Heart className="w-6 h-6" />
      case "message-circle":
        return <MessageCircle className="w-6 h-6" />
      case "camera":
        return <Camera className="w-6 h-6" />
      case "users":
        return <Users className="w-6 h-6" />
      case "star":
        return <Star className="w-6 h-6" />
      default:
        return <Trophy className="w-6 h-6" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Achievements</h1>
            <div className="w-10" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Achievements</h1>
          <div className="w-10" />
        </div>

        {/* Stats Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Achievements Unlocked</span>
                  <span className="font-medium">
                    {completedCount}/{totalCount}
                  </span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{completionPercentage}% Complete</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-amber-600">
                    {achievements.filter((a) => a.completed && a.tier === "bronze").length}
                  </div>
                  <div className="text-xs text-gray-500">Bronze</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-600">
                    {achievements.filter((a) => a.completed && a.tier === "silver").length}
                  </div>
                  <div className="text-xs text-gray-500">Silver</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">
                    {achievements.filter((a) => a.completed && a.tier === "gold").length}
                  </div>
                  <div className="text-xs text-gray-500">Gold</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {achievements.filter((a) => a.completed && a.tier === "platinum").length}
                  </div>
                  <div className="text-xs text-gray-500">Platinum</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Icon className="w-4 h-4" />
                {category.name}
              </Button>
            )
          })}
        </div>

        {/* Achievements Grid */}
        <div className="space-y-3">
          {filteredAchievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`transition-all ${
                achievement.completed ? "bg-white border-green-200" : "bg-gray-50 border-gray-200"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-lg ${
                      achievement.completed ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {getIcon(achievement.icon)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className={`font-medium ${achievement.completed ? "text-gray-900" : "text-gray-500"}`}>
                          {achievement.name}
                        </h3>
                        <p className={`text-sm ${achievement.completed ? "text-gray-600" : "text-gray-400"}`}>
                          {achievement.description}
                        </p>
                      </div>
                      <Badge className={`ml-2 ${getTierColor(achievement.tier)}`}>
                        {achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)}
                      </Badge>
                    </div>

                    {/* Progress */}
                    {!achievement.completed && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Progress</span>
                          <span>
                            {achievement.progress}/{achievement.maxProgress}
                          </span>
                        </div>
                        <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-1.5" />
                      </div>
                    )}

                    {/* Completion Date */}
                    {achievement.completed && achievement.completedAt && (
                      <div className="flex items-center gap-2 mt-2">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-500">
                          Unlocked {new Date(achievement.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h3>
            <p className="text-gray-500">Start using the app to unlock your first achievement!</p>
          </div>
        )}
      </div>
    </div>
  )
}
