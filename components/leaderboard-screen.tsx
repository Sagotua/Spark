"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Trophy, Crown, Medal, Award } from "lucide-react"
import { GamificationService, type LeaderboardEntry } from "@/lib/gamification-system"

interface LeaderboardScreenProps {
  userId: string
  onBack: () => void
}

export default function LeaderboardScreen({ userId, onBack }: LeaderboardScreenProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [selectedType, setSelectedType] = useState<"global" | "local" | "friends">("global")
  const [selectedTimeframe, setSelectedTimeframe] = useState<"daily" | "weekly" | "all-time">("weekly")
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    loadLeaderboard()
  }, [selectedType, selectedTimeframe])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const data = await GamificationService.getLeaderboard(userId, selectedType, selectedTimeframe, 50)
      setLeaderboard(data)

      // Find current user's rank
      const currentUserRank = data.find((entry) => entry.userId === userId)
      setUserRank(currentUserRank || null)
    } catch (error) {
      console.error("Error loading leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case 2:
        return "bg-gray-100 text-gray-800 border-gray-300"
      case 3:
        return "bg-amber-100 text-amber-800 border-amber-300"
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
            <h1 className="text-xl font-bold">Leaderboard</h1>
            <div className="w-10" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
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
          <h1 className="text-xl font-bold">Leaderboard</h1>
          <div className="w-10" />
        </div>

        {/* Type Filter */}
        <div className="flex gap-2 mb-4">
          {[
            { id: "global", name: "Global" },
            { id: "local", name: "Local" },
            { id: "friends", name: "Friends" },
          ].map((type) => (
            <Button
              key={type.id}
              variant={selectedType === type.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(type.id as any)}
              className="flex-1"
            >
              {type.name}
            </Button>
          ))}
        </div>

        {/* Timeframe Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "daily", name: "Today" },
            { id: "weekly", name: "This Week" },
            { id: "all-time", name: "All Time" },
          ].map((timeframe) => (
            <Button
              key={timeframe.id}
              variant={selectedTimeframe === timeframe.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeframe(timeframe.id as any)}
              className="flex-1"
            >
              {timeframe.name}
            </Button>
          ))}
        </div>

        {/* Your Rank */}
        {userRank && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-800">Your Rank</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                <img
                  src={userRank.photo || "/placeholder.svg"}
                  alt={userRank.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-blue-900">{userRank.name}</h3>
                    <Badge className={getRankBadgeColor(userRank.rank)}>#{userRank.rank}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-blue-700">
                    <span>{userRank.points.toLocaleString()} points</span>
                    <span>Level {userRank.level}</span>
                  </div>
                </div>
                {getRankIcon(userRank.rank)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-end justify-center gap-4">
                {/* 2nd Place */}
                <div className="text-center">
                  <div className="relative mb-2">
                    <img
                      src={leaderboard[1].photo || "/placeholder.svg"}
                      alt={leaderboard[1].name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                    />
                    <div className="absolute -top-2 -right-2 bg-gray-100 rounded-full p-1">
                      <Medal className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                  <h3 className="font-medium text-sm truncate w-20">{leaderboard[1].name}</h3>
                  <p className="text-xs text-gray-500">{leaderboard[1].points.toLocaleString()}</p>
                  <div className="bg-gray-200 h-16 w-20 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                    <span className="text-lg font-bold text-gray-600">2</span>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="text-center">
                  <div className="relative mb-2">
                    <img
                      src={leaderboard[0].photo || "/placeholder.svg"}
                      alt={leaderboard[0].name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-yellow-300"
                    />
                    <div className="absolute -top-2 -right-2 bg-yellow-100 rounded-full p-1">
                      <Crown className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                  <h3 className="font-medium text-sm truncate w-24">{leaderboard[0].name}</h3>
                  <p className="text-xs text-gray-500">{leaderboard[0].points.toLocaleString()}</p>
                  <div className="bg-yellow-200 h-20 w-24 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                    <span className="text-xl font-bold text-yellow-700">1</span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="text-center">
                  <div className="relative mb-2">
                    <img
                      src={leaderboard[2].photo || "/placeholder.svg"}
                      alt={leaderboard[2].name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-amber-300"
                    />
                    <div className="absolute -top-2 -right-2 bg-amber-100 rounded-full p-1">
                      <Award className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                  <h3 className="font-medium text-sm truncate w-20">{leaderboard[2].name}</h3>
                  <p className="text-xs text-gray-500">{leaderboard[2].points.toLocaleString()}</p>
                  <div className="bg-amber-200 h-12 w-20 rounded-t-lg mt-2 flex items-end justify-center pb-2">
                    <span className="text-lg font-bold text-amber-700">3</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Full Leaderboard */}
        <div className="space-y-2">
          {leaderboard.slice(3).map((entry) => (
            <Card
              key={entry.userId}
              className={`transition-all ${entry.userId === userId ? "border-blue-200 bg-blue-50" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8">{getRankIcon(entry.rank)}</div>
                  <img
                    src={entry.photo || "/placeholder.svg"}
                    alt={entry.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{entry.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{entry.points.toLocaleString()} points</span>
                      <span>Level {entry.level}</span>
                    </div>
                  </div>
                  {entry.userId === userId && <Badge className="bg-blue-100 text-blue-800 border-blue-300">You</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings yet</h3>
            <p className="text-gray-500">Be the first to earn points and climb the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  )
}
