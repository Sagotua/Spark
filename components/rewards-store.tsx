"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Heart, Zap, Star, CheckCircle, Crown, Gift } from "lucide-react"
import { GamificationService, type Reward, type UserStats } from "@/lib/gamification-system"

interface RewardsStoreProps {
  userId: string
  userStats: UserStats
  onBack: () => void
}

export default function RewardsStore({ userId, userStats, onBack }: RewardsStoreProps) {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    loadRewards()
  }, [userId])

  const loadRewards = async () => {
    try {
      setLoading(true)
      const data = await GamificationService.getRewards(userId)
      setRewards(data)
    } catch (error) {
      console.error("Error loading rewards:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (rewardId: string) => {
    try {
      setPurchasing(rewardId)
      const result = await GamificationService.purchaseReward(userId, rewardId)

      if (result.success) {
        // Show success message
        alert(result.message)
        // Reload rewards to update availability
        await loadRewards()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error("Error purchasing reward:", error)
      alert("An error occurred while purchasing the reward")
    } finally {
      setPurchasing(null)
    }
  }

  const categories = [
    { id: "all", name: "All", icon: Gift },
    { id: "boost", name: "Boosts", icon: Zap },
    { id: "likes", name: "Likes", icon: Heart },
    { id: "premium", name: "Premium", icon: Crown },
  ]

  const filteredRewards = rewards.filter((reward) => selectedCategory === "all" || reward.category === selectedCategory)

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "zap":
        return <Zap className="w-6 h-6" />
      case "star":
        return <Star className="w-6 h-6" />
      case "heart":
        return <Heart className="w-6 h-6" />
      case "check-circle":
        return <CheckCircle className="w-6 h-6" />
      case "crown":
        return <Crown className="w-6 h-6" />
      default:
        return <Gift className="w-6 h-6" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "boost":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "likes":
        return "bg-red-100 text-red-800 border-red-300"
      case "premium":
        return "bg-purple-100 text-purple-800 border-purple-300"
      default:
        return "bg-blue-100 text-blue-800 border-blue-300"
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
            <h1 className="text-xl font-bold">Rewards Store</h1>
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
          <h1 className="text-xl font-bold">Rewards Store</h1>
          <div className="w-10" />
        </div>

        {/* Hearts Balance */}
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-900">Your Hearts</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{userStats.hearts.toLocaleString()}</div>
            </div>
            <p className="text-sm text-red-700 mt-1">Earn hearts by completing challenges and activities</p>
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

        {/* Rewards Grid */}
        <div className="space-y-4">
          {filteredRewards.map((reward) => (
            <Card key={reward.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">{getIcon(reward.icon)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{reward.name}</h3>
                        <p className="text-sm text-gray-600">{reward.description}</p>
                      </div>
                      <Badge className={getCategoryColor(reward.category)}>
                        {reward.category.charAt(0).toUpperCase() + reward.category.slice(1)}
                      </Badge>
                    </div>

                    {/* Price and Purchase */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="font-medium text-gray-900">{reward.cost.toLocaleString()}</span>
                        <span className="text-sm text-gray-500">hearts</span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handlePurchase(reward.id)}
                        disabled={!reward.available || userStats.hearts < reward.cost || purchasing === reward.id}
                        className="min-w-[80px]"
                      >
                        {purchasing === reward.id ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : !reward.available ? (
                          "Unavailable"
                        ) : userStats.hearts < reward.cost ? (
                          "Not enough"
                        ) : (
                          "Buy"
                        )}
                      </Button>
                    </div>

                    {/* Premium Badge */}
                    {reward.premium && (
                      <div className="flex items-center gap-1 mt-2">
                        <Crown className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-purple-600">Premium Feature</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRewards.length === 0 && (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rewards available</h3>
            <p className="text-gray-500">Check back later for new rewards!</p>
          </div>
        )}

        {/* Earn More Hearts */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-sm text-blue-800">Need More Hearts?</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex justify-between">
                <span>Complete daily challenges</span>
                <span className="font-medium">+50-100 hearts</span>
              </div>
              <div className="flex justify-between">
                <span>Get matches</span>
                <span className="font-medium">+5 hearts</span>
              </div>
              <div className="flex justify-between">
                <span>Send messages</span>
                <span className="font-medium">+1 heart</span>
              </div>
              <div className="flex justify-between">
                <span>Unlock achievements</span>
                <span className="font-medium">+10-100 hearts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
