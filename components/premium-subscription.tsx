"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Crown, Zap, Eye, Heart, MessageCircle, Star, Infinity, ArrowLeft } from "lucide-react"

interface PremiumSubscriptionProps {
  currentPlan?: "free" | "premium" | "gold" | "platinum"
  onBack: () => void
}

const plans = {
  premium: {
    name: "Premium",
    price: { monthly: 29.99, yearly: 199.99 },
    color: "from-purple-600 to-pink-600",
    features: [
      { icon: Zap, text: "5 Super Likes per day", included: true },
      { icon: Eye, text: "See who likes you", included: true },
      { icon: Heart, text: "Unlimited likes", included: true },
      { icon: MessageCircle, text: "Priority messages", included: true },
      { icon: Star, text: "Boost profile monthly", included: false },
      { icon: Infinity, text: "Unlimited rewinds", included: false },
    ],
  },
  gold: {
    name: "Gold",
    price: { monthly: 49.99, yearly: 299.99 },
    color: "from-yellow-500 to-orange-500",
    features: [
      { icon: Zap, text: "10 Super Likes per day", included: true },
      { icon: Eye, text: "See who likes you", included: true },
      { icon: Heart, text: "Unlimited likes", included: true },
      { icon: MessageCircle, text: "Priority messages", included: true },
      { icon: Star, text: "Boost profile weekly", included: true },
      { icon: Infinity, text: "Unlimited rewinds", included: true },
    ],
  },
  platinum: {
    name: "Platinum",
    price: { monthly: 79.99, yearly: 499.99 },
    color: "from-gray-600 to-gray-800",
    features: [
      { icon: Zap, text: "Unlimited Super Likes", included: true },
      { icon: Eye, text: "See who likes you", included: true },
      { icon: Heart, text: "Unlimited likes", included: true },
      { icon: MessageCircle, text: "Priority messages", included: true },
      { icon: Star, text: "Boost profile daily", included: true },
      { icon: Infinity, text: "Unlimited rewinds", included: true },
    ],
  },
}

export default function PremiumSubscription({ currentPlan = "free", onBack }: PremiumSubscriptionProps) {
  const [selectedPlan, setSelectedPlan] = useState<"premium" | "gold" | "platinum">("premium")
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubscribe = async () => {
    setIsProcessing(true)

    try {
      // Create Stripe checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          billingPeriod,
          successUrl: `${window.location.origin}/subscription-success`,
          cancelUrl: window.location.href,
        }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Subscription error:", error)
      alert("Failed to start subscription process")
    } finally {
      setIsProcessing(false)
    }
  }

  const calculateSavings = (plan: keyof typeof plans) => {
    const monthly = plans[plan].price.monthly * 12
    const yearly = plans[plan].price.yearly
    return Math.round(((monthly - yearly) / monthly) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-pink-600 p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center text-white mb-8">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">Upgrade to Premium</h1>
            <p className="opacity-90">Unlock premium features</p>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="space-y-4 mb-6">
          {Object.entries(plans).map(([planKey, plan]) => (
            <div
              key={planKey}
              onClick={() => setSelectedPlan(planKey as keyof typeof plans)}
              className={`bg-white rounded-2xl p-6 cursor-pointer transition-all ${
                selectedPlan === planKey ? "ring-4 ring-white/50 scale-105" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mr-3`}
                  >
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-gray-600">
                      ${plan.price[billingPeriod]}/{billingPeriod === "monthly" ? "month" : "year"}
                    </p>
                  </div>
                </div>
                {selectedPlan === planKey && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {plan.features.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="flex items-center">
                      <Icon className={`w-4 h-4 mr-3 ${feature.included ? "text-green-500" : "text-gray-300"}`} />
                      <span className={feature.included ? "text-gray-900" : "text-gray-400"}>{feature.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Billing Period Toggle */}
        <div className="bg-white rounded-2xl p-4 mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                billingPeriod === "monthly" ? "bg-white shadow-sm" : ""
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium relative transition-all ${
                billingPeriod === "yearly" ? "bg-white shadow-sm" : ""
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Save {calculateSavings(selectedPlan)}%
              </span>
            </button>
          </div>
        </div>

        {/* Subscribe Button */}
        <Button
          onClick={handleSubscribe}
          disabled={isProcessing}
          className="w-full bg-white text-purple-600 hover:bg-gray-100 font-semibold py-4 text-lg mb-4"
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : null}
          {isProcessing ? "Processing..." : `Start ${plans[selectedPlan].name}`}
        </Button>

        {/* Terms */}
        <p className="text-white/80 text-sm text-center">
          By subscribing, you agree to our Terms of Service and Privacy Policy. Cancel anytime in your account settings.
        </p>
      </div>
    </div>
  )
}
