"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Shield, Phone, MessageSquare, ArrowLeft, Flag, BlocksIcon as Block } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SafetyCenterProps {
  onBack: () => void
  reportedUserId?: string
  reportedUserName?: string
}

const reportReasons = [
  "Inappropriate photos",
  "Harassment or bullying",
  "Spam or fake profile",
  "Underage user",
  "Inappropriate messages",
  "Scam or fraud",
  "Violence or threats",
  "Other",
]

export default function SafetyCenter({ onBack, reportedUserId, reportedUserName }: SafetyCenterProps) {
  const [activeSection, setActiveSection] = useState<"main" | "report" | "block" | "tips">("main")
  const [selectedReason, setSelectedReason] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReport = async () => {
    if (!reportedUserId || !selectedReason) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("reports").insert({
        reporter_id: "current-user-id", // Replace with actual current user ID
        reported_id: reportedUserId,
        reason: selectedReason,
        description: description,
      })

      if (error) throw error

      alert("Report submitted successfully. We'll review it within 24 hours.")
      onBack()
    } catch (error) {
      console.error("Report error:", error)
      alert("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBlock = async () => {
    if (!reportedUserId) return

    try {
      // In a real app, you'd have a blocks table
      alert(`${reportedUserName} has been blocked. You won't see their profile anymore.`)
      onBack()
    } catch (error) {
      console.error("Block error:", error)
      alert("Failed to block user. Please try again.")
    }
  }

  const safetyFeatures = [
    {
      icon: Shield,
      title: "Photo Verification",
      description: "Verify your identity with a selfie",
      action: () => setActiveSection("main"), // Would navigate to photo verification
      color: "text-blue-500",
    },
    {
      icon: Flag,
      title: "Report User",
      description: "Report inappropriate behavior",
      action: () => setActiveSection("report"),
      color: "text-red-500",
    },
    {
      icon: Block,
      title: "Block User",
      description: "Block someone from contacting you",
      action: () => setActiveSection("block"),
      color: "text-orange-500",
    },
    {
      icon: MessageSquare,
      title: "Safety Tips",
      description: "Learn how to date safely",
      action: () => setActiveSection("tips"),
      color: "text-green-500",
    },
  ]

  const safetyTips = [
    {
      title: "Meet in Public",
      description: "Always meet for the first few dates in public places with lots of people around.",
    },
    {
      title: "Tell a Friend",
      description: "Let someone know where you're going and who you're meeting. Share your location.",
    },
    {
      title: "Trust Your Instincts",
      description: "If something feels off, don't ignore it. It's okay to leave or end the conversation.",
    },
    {
      title: "Don't Share Personal Info",
      description: "Keep your address, workplace, and financial information private until you really trust someone.",
    },
    {
      title: "Video Chat First",
      description: "Have a video call before meeting in person to verify they are who they say they are.",
    },
    {
      title: "Stay Sober",
      description: "Keep your wits about you. Don't drink too much or accept drinks from strangers.",
    },
  ]

  if (activeSection === "report") {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveSection("main")}
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" aria-hidden="true" />
          </Button>
            <h1 className="text-2xl font-bold ml-4">Report {reportedUserName}</h1>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-gray-600">Help us keep the community safe. What's the issue with this user?</p>

            <div className="space-y-2">
              {reportReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full p-4 text-left rounded-lg border transition-colors ${
                    selectedReason === reason ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional details (optional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more context about the issue..."
                rows={4}
              />
            </div>
          </div>

          <Button
            onClick={handleReport}
            disabled={!selectedReason || isSubmitting}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : null}
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>

          <p className="text-sm text-gray-500 text-center mt-4">
            Reports are reviewed within 24 hours. False reports may result in account restrictions.
          </p>
        </div>
      </div>
    )
  }

  if (activeSection === "block") {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveSection("main")}
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" aria-hidden="true" />
          </Button>
            <h1 className="text-2xl font-bold ml-4">Block {reportedUserName}</h1>
          </div>

          <div className="text-center py-8">
            <Block className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-4">Block this user?</h2>
            <p className="text-gray-600 mb-8">
              {reportedUserName} won't be able to see your profile or send you messages. They won't be notified that you
              blocked them.
            </p>

            <div className="space-y-4">
              <Button
                onClick={handleBlock}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
              >
                Block {reportedUserName}
              </Button>
              <Button variant="outline" onClick={() => setActiveSection("main")} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeSection === "tips") {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveSection("main")}
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" aria-hidden="true" />
          </Button>
            <h1 className="text-2xl font-bold ml-4">Safety Tips</h1>
          </div>

          <div className="space-y-6">
            {safetyTips.map((tip, index) => (
              <div key={index} className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">{tip.title}</h3>
                <p className="text-blue-800 text-sm">{tip.description}</p>
              </div>
            ))}

            <div className="bg-red-50 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-red-900 mb-2">Emergency</h3>
              <p className="text-red-800 text-sm mb-3">
                If you feel unsafe or threatened, don't hesitate to contact local authorities.
              </p>
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                <Phone className="w-4 h-4 mr-2" />
                Emergency: 911
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6" aria-hidden="true" />
          </Button>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">Safety Center</h1>
            <p className="text-gray-600">Your safety is our priority</p>
          </div>
        </div>

        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Stay Safe While Dating</h2>
          <p className="text-gray-600">Use these tools and tips to have a safe and positive experience</p>
        </div>

        <div className="space-y-4">
          {safetyFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <button
                key={feature.title}
                onClick={feature.action}
                className="w-full bg-gray-50 rounded-lg p-4 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`w-6 h-6 ${feature.color} mt-1`} />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
          <p className="text-blue-800 text-sm mb-3">Our support team is here to help with any safety concerns.</p>
          <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-100">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}
