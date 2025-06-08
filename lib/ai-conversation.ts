import { supabase } from "./supabase"

export interface ConversationStarter {
  id: string
  text: string
  category: "funny" | "flirty" | "casual" | "deep" | "specific"
  context?: {
    userInterests?: string[]
    userPhotos?: string[]
    userBio?: string
    userJob?: string
    matchInterests?: string[]
    matchPhotos?: string[]
    matchBio?: string
    matchJob?: string
    commonInterests?: string[]
  }
}

export interface MessageSuggestion {
  id: string
  text: string
  context: string
}

export interface ConversationAnalysis {
  sentiment: "positive" | "neutral" | "negative"
  engagementLevel: "high" | "medium" | "low"
  topics: string[]
  suggestedTopics: string[]
  redFlags: string[]
}

export class AIConversationService {
  // Pre-defined conversation starters by category
  private static conversationStarters: Record<string, string[]> = {
    funny: [
      "If you were a vegetable, you'd be a cute-cumber! 🥒",
      "I'm trying to think of a chemistry joke, but I'm afraid I won't get a reaction...",
      "Are you made of copper and tellurium? Because you're Cu-Te! 😉",
      "I was going to tell you a joke about pizza, but it's too cheesy.",
      "What's your favorite conspiracy theory? I need to know if we're compatible 👽",
      "Important question: pineapple on pizza, yes or no? This could make or break us 🍕",
      "If you could have dinner with any fictional character, who would it be and why?",
      "What's the most embarrassing song on your playlist? I promise not to judge (much)",
    ],
    flirty: [
      "I must be a snowflake, because I've fallen for you ❄️",
      "Are you a camera? Because every time I look at you, I smile 📸",
      "Do you have a map? I keep getting lost in your eyes 🗺️",
      "Is your name Google? Because you have everything I've been searching for.",
      "I'm not a photographer, but I can picture us together 📷",
      "They say dating is a numbers game, so can I get yours? 📱",
      "I'd say God bless you, but it looks like he already did 😇",
      "I was going to wait another day to message you, but I couldn't wait that long to talk to someone as interesting as you",
    ],
    casual: [
      "What's the highlight of your week so far?",
      "Coffee, tea, or something stronger? ☕️",
      "What's your go-to comfort food? 🍕",
      "Any exciting plans for the weekend?",
      "What's your favorite way to unwind after a long day?",
      "What's the last great book you read or show you watched?",
      "If you had a free day tomorrow, how would you spend it?",
      "What's your favorite local spot that not enough people know about?",
    ],
    deep: [
      "What's something you've changed your mind about recently?",
      "What's a belief you have that most people disagree with?",
      "What's something you're looking forward to in the next year?",
      "What's the best piece of advice you've ever received?",
      "If you could master one skill overnight, what would it be?",
      "What's something you're passionate about that not many people know?",
      "What's a goal you're working toward right now?",
      "What's something that always makes you laugh, no matter what?",
    ],
    specific: [
      "I see you're into [interest]. What got you started with that?",
      "Your photo at [location] looks amazing! What was your favorite part of being there?",
      "I noticed we both love [common interest]. Have you tried [related activity]?",
      "Your bio mentions [detail]. I'd love to hear more about that!",
      "That [item/pet] in your photo is adorable! What's the story there?",
      "I see you work in [profession]. What's the most interesting part of your job?",
      "We both enjoy [hobby]. What's your favorite thing about it?",
      "Your profile says you're into [activity]. Any recommendations for someone just getting started?",
    ],
  }

  // Get conversation starters based on user and match profiles
  static async getConversationStarters(
    userId: string,
    matchId: string,
    userProfile: any,
    matchProfile: any,
  ): Promise<ConversationStarter[]> {
    try {
      // Find common interests
      const userInterests = userProfile.interests || []
      const matchInterests = matchProfile.interests || []
      const commonInterests = userInterests.filter((interest: string) => matchInterests.includes(interest))

      // Create context for personalization
      const context = {
        userInterests,
        userPhotos: userProfile.photos || [],
        userBio: userProfile.bio || "",
        userJob: userProfile.job || "",
        matchInterests,
        matchPhotos: matchProfile.photos || [],
        matchBio: matchProfile.bio || "",
        matchJob: matchProfile.job || "",
        commonInterests,
      }

      // Generate starters for each category
      const starters: ConversationStarter[] = []

      // Add generic starters from each category
      Object.entries(this.conversationStarters).forEach(([category, texts]) => {
        texts.forEach((text) => {
          starters.push({
            id: `${category}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text,
            category: category as any,
            context,
          })
        })
      })

      // Add personalized starters based on profiles
      if (matchProfile.bio) {
        starters.push({
          id: `specific-bio-${Date.now()}`,
          text: `I enjoyed reading your bio! "${matchProfile.bio.substring(0, 30)}..." - What inspired you to write that?`,
          category: "specific",
          context,
        })
      }

      if (matchProfile.job) {
        starters.push({
          id: `specific-job-${Date.now()}`,
          text: `I see you work as a ${matchProfile.job}. What's the most interesting part of your job?`,
          category: "specific",
          context,
        })
      }

      // Add starters based on common interests
      commonInterests.forEach((interest: string) => {
        starters.push({
          id: `common-${interest}-${Date.now()}`,
          text: `I see we both enjoy ${interest}! What's your favorite thing about it?`,
          category: "specific",
          context,
        })
      })

      // If they have photos with activities, comment on them
      if (matchProfile.photos && matchProfile.photos.length > 0) {
        starters.push({
          id: `photo-${Date.now()}`,
          text: `That photo of you ${
            Math.random() > 0.5 ? "with the amazing background" : "doing that activity"
          } caught my eye! What's the story behind it?`,
          category: "specific",
          context,
        })
      }

      // Shuffle and return limited number
      return this.shuffleArray(starters).slice(0, 10)
    } catch (error) {
      console.error("Error generating conversation starters:", error)
      // Return fallback starters
      return this.getFallbackStarters()
    }
  }

  // Get reply suggestions based on conversation history
  static async getMessageSuggestions(
    userId: string,
    matchId: string,
    conversationHistory: { sender: string; text: string; timestamp: Date }[],
  ): Promise<MessageSuggestion[]> {
    try {
      if (conversationHistory.length === 0) {
        return []
      }

      // Get the last message in the conversation
      const lastMessage = conversationHistory[conversationHistory.length - 1]

      // Don't suggest replies to your own messages
      if (lastMessage.sender === userId) {
        return []
      }

      const lastMessageText = lastMessage.text.toLowerCase()

      // Simple rule-based suggestions
      const suggestions: MessageSuggestion[] = []

      // Question detection
      if (lastMessageText.includes("?")) {
        if (lastMessageText.includes("how are you") || lastMessageText.includes("how's it going")) {
          suggestions.push({
            id: `reply-${Date.now()}-1`,
            text: "I'm doing great, thanks for asking! How about you?",
            context: "responding to greeting",
          })
        } else if (lastMessageText.includes("what") && lastMessageText.includes("weekend")) {
          suggestions.push({
            id: `reply-${Date.now()}-2`,
            text: "I have a few things planned with friends, but I'm keeping some time open too. How about you?",
            context: "weekend plans",
          })
        } else if (lastMessageText.includes("favorite")) {
          suggestions.push({
            id: `reply-${Date.now()}-3`,
            text: "That's a tough question! I have so many favorites. Let me think about it...",
            context: "favorite things",
          })
        } else {
          suggestions.push({
            id: `reply-${Date.now()}-4`,
            text: "That's an interesting question! Let me think...",
            context: "general question",
          })
        }
      }

      // Add some generic good replies
      suggestions.push({
        id: `reply-${Date.now()}-5`,
        text: "I was just thinking about that the other day! Great minds think alike 😊",
        context: "agreement",
      })

      suggestions.push({
        id: `reply-${Date.now()}-6`,
        text: "That's really interesting! Tell me more about that.",
        context: "showing interest",
      })

      suggestions.push({
        id: `reply-${Date.now()}-7`,
        text: "Haha, that made me smile. You have a great sense of humor!",
        context: "humor appreciation",
      })

      // Add a question to keep conversation going
      suggestions.push({
        id: `reply-${Date.now()}-8`,
        text: "By the way, what do you enjoy doing on weekends?",
        context: "conversation continuation",
      })

      // Shuffle and return limited number
      return this.shuffleArray(suggestions).slice(0, 3)
    } catch (error) {
      console.error("Error generating message suggestions:", error)
      return []
    }
  }

  // Analyze conversation for insights
  static async analyzeConversation(
    conversationHistory: { sender: string; text: string; timestamp: Date }[],
  ): Promise<ConversationAnalysis> {
    try {
      if (conversationHistory.length < 3) {
        return {
          sentiment: "neutral",
          engagementLevel: "medium",
          topics: [],
          suggestedTopics: ["hobbies", "travel", "food", "movies"],
          redFlags: [],
        }
      }

      // Simple analysis based on message frequency and length
      const lastFiveMessages = conversationHistory.slice(-5)
      const averageLength = lastFiveMessages.reduce((sum, msg) => sum + msg.text.length, 0) / lastFiveMessages.length
      const uniqueSenders = new Set(lastFiveMessages.map((msg) => msg.sender)).size
      const timeSpans = []

      for (let i = 1; i < lastFiveMessages.length; i++) {
        timeSpans.push(lastFiveMessages[i].timestamp.getTime() - lastFiveMessages[i - 1].timestamp.getTime())
      }
      const averageTimeSpan = timeSpans.reduce((sum, span) => sum + span, 0) / timeSpans.length

      // Determine engagement level
      let engagementLevel: "high" | "medium" | "low" = "medium"
      if (averageLength > 50 && averageTimeSpan < 5 * 60 * 1000) {
        // 5 minutes
        engagementLevel = "high"
      } else if (averageLength < 15 || averageTimeSpan > 30 * 60 * 1000) {
        // 30 minutes
        engagementLevel = "low"
      }

      // Simple sentiment analysis
      const positiveWords = [
        "happy",
        "great",
        "excited",
        "love",
        "enjoy",
        "amazing",
        "wonderful",
        "good",
        "like",
        "fun",
      ]
      const negativeWords = [
        "sad",
        "bad",
        "hate",
        "boring",
        "annoying",
        "terrible",
        "awful",
        "dislike",
        "sorry",
        "busy",
      ]

      let positiveCount = 0
      let negativeCount = 0

      lastFiveMessages.forEach((msg) => {
        const text = msg.text.toLowerCase()
        positiveWords.forEach((word) => {
          if (text.includes(word)) positiveCount++
        })
        negativeWords.forEach((word) => {
          if (text.includes(word)) negativeCount++
        })
      })

      let sentiment: "positive" | "neutral" | "negative" = "neutral"
      if (positiveCount > negativeCount + 2) {
        sentiment = "positive"
      } else if (negativeCount > positiveCount + 1) {
        sentiment = "negative"
      }

      // Extract potential topics
      const allText = conversationHistory.map((msg) => msg.text.toLowerCase()).join(" ")
      const topics = []

      const topicKeywords = {
        travel: ["travel", "trip", "vacation", "visit", "country", "city", "place"],
        food: ["food", "restaurant", "eat", "dinner", "lunch", "cook", "recipe"],
        movies: ["movie", "film", "watch", "cinema", "theater", "actor", "director"],
        music: ["music", "song", "band", "concert", "album", "listen", "playlist"],
        sports: ["sport", "game", "team", "play", "match", "workout", "exercise"],
        work: ["work", "job", "career", "office", "company", "business", "project"],
      }

      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some((keyword) => allText.includes(keyword))) {
          topics.push(topic)
        }
      })

      // Suggest topics not yet discussed
      const allTopics = Object.keys(topicKeywords)
      const suggestedTopics = allTopics.filter((topic) => !topics.includes(topic)).slice(0, 3)

      // Check for potential red flags
      const redFlags = []
      const redFlagKeywords = ["ex", "broke up", "not over", "just ended", "still seeing"]

      if (redFlagKeywords.some((keyword) => allText.includes(keyword))) {
        redFlags.push("Mentions ex-partners frequently")
      }

      if (
        conversationHistory.length > 5 &&
        conversationHistory.slice(-5).every((msg) => msg.sender === conversationHistory[0].sender)
      ) {
        redFlags.push("One-sided conversation")
      }

      return {
        sentiment,
        engagementLevel,
        topics,
        suggestedTopics,
        redFlags,
      }
    } catch (error) {
      console.error("Error analyzing conversation:", error)
      return {
        sentiment: "neutral",
        engagementLevel: "medium",
        topics: [],
        suggestedTopics: ["hobbies", "travel", "food", "movies"],
        redFlags: [],
      }
    }
  }

  // Save user's favorite conversation starters
  static async saveFavoriteStarter(userId: string, starter: ConversationStarter): Promise<void> {
    try {
      if (supabase) {
        await supabase.from("favorite_starters").insert({
          user_id: userId,
          text: starter.text,
          category: starter.category,
        })
      }
    } catch (error) {
      console.error("Error saving favorite starter:", error)
    }
  }

  // Helper method to shuffle array
  private static shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  // Fallback conversation starters
  private static getFallbackStarters(): ConversationStarter[] {
    return [
      {
        id: "fallback-1",
        text: "Hey there! What's something you're looking forward to this week?",
        category: "casual",
      },
      {
        id: "fallback-2",
        text: "If you could travel anywhere right now, where would you go?",
        category: "casual",
      },
      {
        id: "fallback-3",
        text: "What's your idea of a perfect day?",
        category: "deep",
      },
      {
        id: "fallback-4",
        text: "I'm terrible at starting conversations, but I really wanted to talk to you. How's your day going?",
        category: "funny",
      },
      {
        id: "fallback-5",
        text: "Coffee, tea, or something stronger?",
        category: "casual",
      },
    ]
  }
}
