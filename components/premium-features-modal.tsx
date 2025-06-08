"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PremiumFeaturesService, type PremiumUsage } from "@/lib/premium-features"
import { Star, Zap, RotateCcw, MapPin, Crown, CheckCheck, Infinity, Filter, X } from "lucide-react"

interface PremiumFeaturesModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onUpgrade: () => void
  feature?: "super-like" | "boost" | "rewind" | "passport"
}

export default function PremiumFeaturesModal({
  userId,
  isOpen,
  onClose,
  onUpgrade,
  feature,
}: PremiumFeaturesModalProps) {
  const [usage, setUsage] = useState<PremiumUsage | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(feature || "super-like")

  useEffect(() => {
    if (isOpen) {
      loadUsage()
    }
  }, [isOpen, userId])

  const loadUsage = async () => {
    try {
      const premiumUsage = await PremiumFeaturesService.getPremiumUsage(userId)
      setUsage(premiumUsage)
    } catch (error) {
      console.error("Error loading usage:", error)
    }
  }

  const handleFeatureAction = async (action: string) => {
    if (!usage) return

    setLoading(true)
    try {
      let result
      switch (action) {
        case "super-like":
          // This would be called when actually super liking someone
          break
        case "boost":
          result = await PremiumFeaturesService.activateBoost(userId)
          if (result.success) {
            alert(result.message)
            loadUsage()
          } else {
            alert(result.message)
          }
          break
        case "rewind":
          result = await PremiumFeaturesService.rewindLastSwipe(userId)
          if (result.success) {
            alert(result.message)
            loadUsage()
          } else {
            alert(result.message)
          }
          break
      }
    } catch (error) {
      console.error("Feature action error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !usage) return null

  const features = [
    {
      id: "super-like",
      icon: Star,
      title: "Super Like",
      description: "Stand out with a Super Like - they'll know you're really interested",
      available: usage.superLikesLimit - usage.superLikesUsed,
      limit: usage.superLikesLimit,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      premium: false,
    },
    {
      id: "boost",
      icon: Zap,
      title: "Boost",
      description: "Be one of the top profiles in your area for 30 minutes",
      available: usage.boostsLimit - usage.boostsUsed,
      limit: usage.boostsLimit,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      premium: true,
    },
    {
      id: "rewind",
      icon: RotateCcw,
      title: "Rewind",
      description: "Undo your last swipe and get a second chance",
      available: usage.rewindsLimit === 999 ? "∞" : usage.rewindsLimit - usage.rewindsUsed,
      limit: usage.rewindsLimit === 999 ? "∞" : usage.rewindsLimit,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      premium: true,
    },
    {
      id: "passport",
      icon: MapPin,
      title: "Passport",
      description: "Change your location to anywhere in the world",
      available: "∞",
      limit: "∞",
      color: "text-green-500",
      bgColor: "bg-green-50",
      premium: true,
    },
  ]

  const premiumFeatures = [
    { icon: CheckCheck, text: "See who likes you" },
    { icon: Infinity, text: "Unlimited likes" },
    { icon: Filter, text: "Advanced filters" },
    { icon: Crown, text: "Priority likes" },
    { icon: Star, text: "5 Super Likes per day" },
    { icon: Zap, text: "1 Boost per month" },
    { icon: RotateCcw, text: "Unlimited rewinds" },
    { icon: MapPin, text: "Passport to anywhere" },
  ]

  const selectedFeature = features.find((f) => f.id === activeTab)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Premium Features</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Feature Tabs */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {features.map((feature) => {
              const Icon = feature.icon
              const isActive = activeTab === feature.id
              const hasAvailable = typeof feature.available === "number" ? feature.available > 0 : true

              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveTab(feature.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isActive ? `border-pink-500 ${feature.bgColor}` : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Icon className={`w-6 h-6 ${isActive ? feature.color : "text-gray-400"}`} />
                    {feature.premium && <Crown className="w-3 h-3 text-yellow-500 ml-1" />}
                  </div>
                  <div className="text-sm font-medium">{feature.title}</div>
                  <div className="text-xs text-gray-500">
                    {feature.available}/{feature.limit}
                  </div>
                  {!hasAvailable && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Used up
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>

          {/* Selected Feature Details */}
          {selectedFeature && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${selectedFeature.bgColor}`}>
                <div className="flex items-center mb-2">
                  <selectedFeature.icon className={`w-6 h-6 ${selectedFeature.color} mr-2`} />
                  <h3 className="font-semibold">{selectedFeature.title}</h3>
                  {selectedFeature.premium && <Crown className="w-4 h-4 text-yellow-500 ml-2" />}
                </div>
                <p className="text-sm text-gray-600 mb-3">{selectedFeature.description}</p>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">Available: </span>
                    <span className={selectedFeature.available === 0 ? "text-red-500" : "text-green-500"}>
                      {selectedFeature.available}
                    </span>
                    <span className="text-gray-500">/{selectedFeature.limit}</span>
                  </div>

                  {selectedFeature.id === "boost" && (
                    <Button
                      onClick={() => handleFeatureAction("boost")}
                      disabled={loading || selectedFeature.available === 0}
                      className="bg-purple-500 hover:bg-purple-600"
                    >
                      {loading ? "Activating..." : "Activate Boost"}
                    </Button>
                  )}

                  {selectedFeature.id === "rewind" && (
                    <Button
                      onClick={() => handleFeatureAction("rewind")}
                      disabled={loading || selectedFeature.available === 0}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      {loading ? "Rewinding..." : "Rewind"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Premium Upgrade CTA */}
              {selectedFeature.premium && selectedFeature.available === 0 && (
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Upgrade to Premium</h4>
                  <p className="text-sm mb-3">Get unlimited access to all premium features</p>
                  <Button onClick={onUpgrade} className="bg-white text-pink-500 hover:bg-gray-100 w-full">
                    Upgrade Now
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Premium Features List */}
          <div className="mt-6 p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center">
              <Crown className="w-5 h-5 text-yellow-500 mr-2" />
              Premium Features
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <feature.icon className="w-4 h-4 text-pink-500 mr-2" />
                  {feature.text}
                </div>
              ))}
            </div>
            <Button
              onClick={onUpgrade}
              className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              Get Premium
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
