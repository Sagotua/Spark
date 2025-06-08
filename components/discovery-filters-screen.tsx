"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, MapPin, Heart, User, GraduationCap } from "lucide-react"
import { DiscoveryFilterService, type DiscoveryFilters } from "@/lib/discovery-filters"

interface DiscoveryFiltersScreenProps {
  userId: string
  onBack: () => void
  onFiltersApplied: (filters: DiscoveryFilters) => void
}

export default function DiscoveryFiltersScreen({ userId, onBack, onFiltersApplied }: DiscoveryFiltersScreenProps) {
  const [filters, setFilters] = useState<DiscoveryFilters>(DiscoveryFilterService.getDefaultFilters())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFilters()
  }, [userId])

  const loadFilters = async () => {
    try {
      const savedFilters = await DiscoveryFilterService.loadFilters(userId)
      setFilters(savedFilters)
    } catch (error) {
      console.error("Load filters error:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveFilters = async () => {
    try {
      await DiscoveryFilterService.saveFilters(userId, filters)
      onFiltersApplied(filters)
      onBack()
    } catch (error) {
      console.error("Save filters error:", error)
    }
  }

  const resetFilters = () => {
    setFilters(DiscoveryFilterService.getDefaultFilters())
  }

  const updateFilter = (key: keyof DiscoveryFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const updateNestedFilter = (category: string, key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof DiscoveryFilters],
        [key]: value,
      },
    }))
  }

  const toggleInterest = (interest: string) => {
    setFilters((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const availableInterests = [
    "Travel",
    "Music",
    "Movies",
    "Sports",
    "Food",
    "Art",
    "Books",
    "Gaming",
    "Fitness",
    "Photography",
    "Dancing",
    "Cooking",
    "Nature",
    "Technology",
    "Fashion",
    "Wine",
    "Coffee",
    "Yoga",
    "Hiking",
    "Beach",
    "Skiing",
    "Pets",
  ]

  const dealBreakerOptions = [
    "smoker",
    "drinks_regularly",
    "no_kids",
    "wants_kids",
    "long_distance",
    "different_religion",
    "no_education",
    "unemployed",
    "party_lifestyle",
  ]

  const mustHaveOptions = [
    "verified",
    "premium",
    "fitness_enthusiast",
    "educated",
    "professional",
    "family_oriented",
    "travel_lover",
    "creative",
    "ambitious",
    "spiritual",
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold ml-4">Discovery Filters</h1>
          </div>
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Basic Filters */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold">Basic Preferences</h2>
          </div>

          {/* Age Range */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Age Range: {filters.ageRange[0]} - {filters.ageRange[1]}
            </label>
            <div className="px-2">
              <Slider
                value={filters.ageRange}
                onValueChange={(value) => updateFilter("ageRange", value as [number, number])}
                min={18}
                max={80}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="block text-sm font-medium mb-2">Maximum Distance: {filters.maxDistance} km</label>
            <div className="px-2">
              <Slider
                value={[filters.maxDistance]}
                onValueChange={(value) => updateFilter("maxDistance", value[0])}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Gender Preference */}
          <div>
            <label className="block text-sm font-medium mb-2">Gender Preference</label>
            <div className="grid grid-cols-3 gap-2">
              {["all", "male", "female"].map((gender) => (
                <Button
                  key={gender}
                  variant={filters.genderPreference === gender ? "default" : "outline"}
                  onClick={() => updateFilter("genderPreference", gender)}
                  className={filters.genderPreference === gender ? "bg-pink-500 hover:bg-pink-600" : ""}
                >
                  {gender === "all" ? "Everyone" : gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verified profiles only</span>
              <Switch
                checked={filters.verifiedOnly}
                onCheckedChange={(checked) => updateFilter("verifiedOnly", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Premium members only</span>
              <Switch
                checked={filters.premiumOnly}
                onCheckedChange={(checked) => updateFilter("premiumOnly", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recently active (7 days)</span>
              <Switch
                checked={filters.recentlyActive}
                onCheckedChange={(checked) => updateFilter("recentlyActive", checked)}
              />
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold">Interests</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {availableInterests.map((interest) => (
              <Button
                key={interest}
                variant={filters.interests.includes(interest) ? "default" : "outline"}
                onClick={() => toggleInterest(interest)}
                className={`text-sm ${filters.interests.includes(interest) ? "bg-pink-500 hover:bg-pink-600" : ""}`}
              >
                {interest}
              </Button>
            ))}
          </div>
        </div>

        {/* Lifestyle */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold">Lifestyle</h2>
          </div>

          <div className="space-y-4">
            {Object.entries({
              smoking: "Smoking",
              drinking: "Drinking",
              exercise: "Exercise",
              diet: "Diet",
            }).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2">{label}</label>
                <div className="grid grid-cols-4 gap-2">
                  {["any", "never", "sometimes", "regularly"].map((option) => (
                    <Button
                      key={option}
                      variant={
                        filters.lifestyle[key as keyof typeof filters.lifestyle] === option ? "default" : "outline"
                      }
                      onClick={() => updateNestedFilter("lifestyle", key, option)}
                      className={`text-xs ${
                        filters.lifestyle[key as keyof typeof filters.lifestyle] === option
                          ? "bg-pink-500 hover:bg-pink-600"
                          : ""
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education & Career */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold">Education & Career</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Education Level</label>
              <div className="grid grid-cols-2 gap-2">
                {["any", "high_school", "college", "graduate"].map((level) => (
                  <Button
                    key={level}
                    variant={filters.education.level === level ? "default" : "outline"}
                    onClick={() => updateNestedFilter("education", "level", level)}
                    className={`text-sm ${filters.education.level === level ? "bg-pink-500 hover:bg-pink-600" : ""}`}
                  >
                    {level === "any" ? "Any" : level.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm">Education required</span>
                <Switch
                  checked={filters.education.required}
                  onCheckedChange={(checked) => updateNestedFilter("education", "required", checked)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Relationship Goals */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold">Relationship Goals</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Looking for</label>
              <div className="grid grid-cols-2 gap-2">
                {["any", "casual", "serious", "marriage"].map((type) => (
                  <Button
                    key={type}
                    variant={filters.relationship.type === type ? "default" : "outline"}
                    onClick={() => updateNestedFilter("relationship", "type", type)}
                    className={`text-sm ${filters.relationship.type === type ? "bg-pink-500 hover:bg-pink-600" : ""}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Has Kids</label>
              <div className="grid grid-cols-3 gap-2">
                {["any", "yes", "no"].map((option) => (
                  <Button
                    key={option}
                    variant={filters.relationship.hasKids === option ? "default" : "outline"}
                    onClick={() => updateNestedFilter("relationship", "hasKids", option)}
                    className={`text-sm ${
                      filters.relationship.hasKids === option ? "bg-pink-500 hover:bg-pink-600" : ""
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Wants Kids</label>
              <div className="grid grid-cols-4 gap-2">
                {["any", "yes", "no", "maybe"].map((option) => (
                  <Button
                    key={option}
                    variant={filters.relationship.wantsKids === option ? "default" : "outline"}
                    onClick={() => updateNestedFilter("relationship", "wantsKids", option)}
                    className={`text-xs ${
                      filters.relationship.wantsKids === option ? "bg-pink-500 hover:bg-pink-600" : ""
                    }`}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Deal Breakers */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-600">Deal Breakers</h2>
          <p className="text-sm text-gray-600">Hide profiles with these traits</p>
          <div className="grid grid-cols-2 gap-2">
            {dealBreakerOptions.map((option) => (
              <Button
                key={option}
                variant={filters.dealBreakers.includes(option) ? "destructive" : "outline"}
                onClick={() => {
                  const updated = filters.dealBreakers.includes(option)
                    ? filters.dealBreakers.filter((item) => item !== option)
                    : [...filters.dealBreakers, option]
                  updateFilter("dealBreakers", updated)
                }}
                className="text-sm"
              >
                {option.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>

        {/* Must Haves */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-green-600">Must Haves</h2>
          <p className="text-sm text-gray-600">Only show profiles with these traits</p>
          <div className="grid grid-cols-2 gap-2">
            {mustHaveOptions.map((option) => (
              <Button
                key={option}
                variant={filters.mustHaves.includes(option) ? "default" : "outline"}
                onClick={() => {
                  const updated = filters.mustHaves.includes(option)
                    ? filters.mustHaves.filter((item) => item !== option)
                    : [...filters.mustHaves, option]
                  updateFilter("mustHaves", updated)
                }}
                className={`text-sm ${filters.mustHaves.includes(option) ? "bg-green-500 hover:bg-green-600" : ""}`}
              >
                {option.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-0 bg-white border-t p-4">
        <Button onClick={saveFilters} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3">
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
