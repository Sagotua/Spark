"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import type { Challenge } from "@/lib/gamification-system"
import { type LucideIcon, Award, Zap, Star, Trophy } from "lucide-react"

interface DailyChallengesProps {
  userId: string
  userStats: any
}

export default function DailyChallenges({ userId, userStats }: DailyChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>(userStats?.challenges || [])
  const [isExpanded, setIsExpanded] = useState(false)

  // Get icon component based on icon name
  const getIcon = (iconName: string): LucideIcon => {
    switch (iconName) {
      case "award":
        return Award
      case "zap":
        return Zap
      case "star":
        return Star
      default:
        return Trophy
    }
  }

  return (
    <Card className="mb-4 border-2 border-amber-300 bg-amber-50">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-amber-800">Daily Challenges</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-amber-800 hover:bg-amber-200"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide" : "Show All"}
          </Button>
        </div>
        <CardDescription className="text-amber-700">Complete challenges to earn points and rewards!</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        {challenges.length === 0 ? (
          <div className="text-center py-4 text-amber-700">No active challenges</div>
        ) : (
          <div className="space-y-3">
            {challenges.slice(0, isExpanded ? challenges.length : 1).map((challenge) => {
              const Icon = getIcon(challenge.icon)
              const progress = Math.round((challenge.progress / challenge.maxProgress) * 100)

              return (
                <div key={challenge.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-amber-200 p-1.5">
                        <Icon className="h-4 w-4 text-amber-800" />
                      </div>
                      <span className="font-medium text-amber-900">{challenge.name}</span>
                    </div>
                    <span className="text-xs font-medium text-amber-700">+{challenge.points} pts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-2 flex-1" />
                    <span className="text-xs text-amber-700">
                      {challenge.progress}/{challenge.maxProgress}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-amber-200 pt-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-amber-200 p-1">
              <Trophy className="h-4 w-4 text-amber-800" />
            </div>
            <span className="text-sm font-medium text-amber-900">{userStats?.streaks?.challenge || 0}-day streak</span>
          </div>
          <span className="text-xs font-medium text-amber-700">{userStats?.points?.today || 0} points today</span>
        </div>
      </CardContent>
    </Card>
  )
}
