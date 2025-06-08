"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AIConversationService, type ConversationAnalysis } from "@/lib/ai-conversation"
import { BarChart2, ThumbsUp, ThumbsDown, AlertTriangle, MessageCircle, Lightbulb } from "lucide-react"

interface ConversationInsightsProps {
  conversationHistory: { sender: string; text: string; timestamp: Date }[]
  onClose: () => void
}

export default function ConversationInsights({ conversationHistory, onClose }: ConversationInsightsProps) {
  const [analysis, setAnalysis] = useState<ConversationAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyzeConversation()
  }, [])

  const analyzeConversation = async () => {
    try {
      setLoading(true)
      const result = await AIConversationService.analyzeConversation(conversationHistory)
      setAnalysis(result)
    } catch (error) {
      console.error("Error analyzing conversation:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-t-xl p-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <BarChart2 className="w-5 h-5 text-blue-500 mr-2" />
            Conversation Insights
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="bg-white rounded-t-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversation Insights</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="text-center py-8 text-gray-500">Unable to analyze conversation</div>
      </div>
    )
  }

  const getSentimentIcon = () => {
    switch (analysis.sentiment) {
      case "positive":
        return <ThumbsUp className="w-5 h-5 text-green-500" />
      case "negative":
        return <ThumbsDown className="w-5 h-5 text-red-500" />
      default:
        return <MessageCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getEngagementColor = () => {
    switch (analysis.engagementLevel) {
      case "high":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="bg-white rounded-t-xl p-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <BarChart2 className="w-5 h-5 text-blue-500 mr-2" />
          Conversation Insights
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="space-y-6">
        {/* Sentiment & Engagement */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              {getSentimentIcon()}
              <h3 className="font-medium ml-2">Sentiment</h3>
            </div>
            <p className="text-sm capitalize">{analysis.sentiment}</p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <div className={`w-3 h-3 rounded-full ${getEngagementColor()}`} />
              <h3 className="font-medium ml-2">Engagement</h3>
            </div>
            <p className="text-sm capitalize">{analysis.engagementLevel}</p>
          </div>
        </div>

        {/* Topics */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-3">
            <MessageCircle className="w-5 h-5 text-purple-500" />
            <h3 className="font-medium ml-2">Conversation Topics</h3>
          </div>
          {analysis.topics.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {analysis.topics.map((topic) => (
                <span key={topic} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full capitalize">
                  {topic}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No specific topics detected yet</p>
          )}
        </div>

        {/* Suggested Topics */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="font-medium ml-2">Suggested Topics</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.suggestedTopics.map((topic) => (
              <span key={topic} className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full capitalize">
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Red Flags */}
        {analysis.redFlags.length > 0 && (
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-medium ml-2 text-red-700">Potential Concerns</h3>
            </div>
            <ul className="text-sm text-red-700 space-y-1">
              {analysis.redFlags.map((flag, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tips */}
        <div className="border rounded-lg p-4 bg-blue-50">
          <div className="flex items-center mb-3">
            <Lightbulb className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium ml-2 text-blue-700">Conversation Tips</h3>
          </div>
          <ul className="text-sm text-blue-700 space-y-2">
            {analysis.engagementLevel === "low" && (
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Try asking open-ended questions to increase engagement
              </li>
            )}
            {analysis.sentiment === "negative" && (
              <li className="flex items-start">
                <span className="mr-2">•</span>
                The conversation tone seems negative. Consider shifting to a more positive topic
              </li>
            )}
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Share something interesting about yourself related to {analysis.suggestedTopics[0] || "your interests"}
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Ask about their experience with {analysis.suggestedTopics[1] || "their hobbies"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
