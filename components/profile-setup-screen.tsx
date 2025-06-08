"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload } from "lucide-react"
import type { User } from "@/app/page"

interface ProfileSetupScreenProps {
  onComplete: (user: User) => void
  onNavigate: (screen: string) => void
}

export default function ProfileSetupScreen({ onComplete, onNavigate }: ProfileSetupScreenProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    bio: "",
    interests: [] as string[],
    photos: ["/placeholder.svg?height=600&width=400"],
  })

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
  ]

  const handleComplete = () => {
    const newUser: User = {
      id: "setup-user",
      name: formData.name,
      age: Number.parseInt(formData.age),
      bio: formData.bio,
      photos: formData.photos,
      interests: formData.interests,
      location: "San Francisco",
      gender: "other",
    }
    onComplete(newUser)
  }

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="icon" onClick={() => (step > 1 ? setStep(step - 1) : onNavigate("register"))}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i <= step ? "bg-pink-500" : "bg-gray-300"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Add Photos</h1>
            <p className="text-gray-600">Upload at least one photo to get started</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Add Photo</p>
              </div>
            </div>
          </div>

          <Button onClick={() => setStep(2)} className="w-full bg-pink-500 hover:bg-pink-600">
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">About You</h1>
            <p className="text-gray-600">Tell us a bit about yourself</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Age</label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                placeholder="Enter your age"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Bio</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Write a short bio about yourself"
                rows={3}
              />
            </div>
          </div>

          <Button onClick={() => setStep(3)} className="w-full bg-pink-500 hover:bg-pink-600">
            Continue
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Your Interests</h1>
            <p className="text-gray-600">Select what you're passionate about</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {availableInterests.map((interest) => (
              <Button
                key={interest}
                variant={formData.interests.includes(interest) ? "default" : "outline"}
                className={`${
                  formData.interests.includes(interest)
                    ? "bg-pink-500 hover:bg-pink-600"
                    : "hover:bg-pink-50 hover:border-pink-200"
                }`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Button>
            ))}
          </div>

          <Button
            onClick={handleComplete}
            className="w-full bg-pink-500 hover:bg-pink-600"
            disabled={formData.interests.length === 0}
          >
            Complete Setup
          </Button>
        </div>
      )}
    </div>
  )
}
