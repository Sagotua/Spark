import { supabase } from "./supabase"

export interface Story {
  id: string
  userId: string
  userName: string
  userPhoto: string
  mediaUrl: string
  mediaType: "photo" | "video"
  caption?: string
  createdAt: Date
  expiresAt: Date
  views: StoryView[]
  reactions: StoryReaction[]
  isHighlight?: boolean
  highlightTitle?: string
}

export interface StoryView {
  id: string
  storyId: string
  viewerId: string
  viewerName: string
  viewerPhoto: string
  viewedAt: Date
}

export interface StoryReaction {
  id: string
  storyId: string
  reactorId: string
  reactorName: string
  reactorPhoto: string
  reactionType: "heart" | "fire" | "wow" | "laugh" | "sad"
  createdAt: Date
}

export interface StoryHighlight {
  id: string
  userId: string
  title: string
  coverPhoto: string
  stories: Story[]
  createdAt: Date
  updatedAt: Date
}

export class StoriesService {
  private static stories: Story[] = []
  private static highlights: StoryHighlight[] = []

  static async createStory(
    userId: string,
    userName: string,
    userPhoto: string,
    mediaFile: File,
    caption?: string,
  ): Promise<Story> {
    try {
      // In a real app, upload to storage
      const mediaUrl = URL.createObjectURL(mediaFile)
      const mediaType = mediaFile.type.startsWith("video/") ? "video" : "photo"

      const story: Story = {
        id: Date.now().toString(),
        userId,
        userName,
        userPhoto,
        mediaUrl,
        mediaType,
        caption,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        views: [],
        reactions: [],
      }

      if (!supabase) {
        // Mock storage for demo
        this.stories.push(story)
        return story
      }

      // In production, save to database
      const { data, error } = await supabase.from("stories").insert({
        user_id: userId,
        media_url: mediaUrl,
        media_type: mediaType,
        caption,
        expires_at: story.expiresAt.toISOString(),
      })

      if (error) throw error

      return story
    } catch (error) {
      console.error("Create story error:", error)
      throw error
    }
  }

  static async getActiveStories(): Promise<Story[]> {
    try {
      if (!supabase) {
        // Return mock stories that haven't expired
        const now = new Date()
        return this.stories.filter((story) => story.expiresAt > now)
      }

      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Get active stories error:", error)
      return []
    }
  }

  static async getUserStories(userId: string): Promise<Story[]> {
    try {
      if (!supabase) {
        return this.stories.filter((story) => story.userId === userId && story.expiresAt > new Date())
      }

      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", userId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Get user stories error:", error)
      return []
    }
  }

  static async viewStory(storyId: string, viewerId: string, viewerName: string, viewerPhoto: string): Promise<void> {
    try {
      const view: StoryView = {
        id: Date.now().toString(),
        storyId,
        viewerId,
        viewerName,
        viewerPhoto,
        viewedAt: new Date(),
      }

      if (!supabase) {
        // Add to mock story
        const story = this.stories.find((s) => s.id === storyId)
        if (story && !story.views.find((v) => v.viewerId === viewerId)) {
          story.views.push(view)
        }
        return
      }

      await supabase.from("story_views").insert({
        story_id: storyId,
        viewer_id: viewerId,
      })
    } catch (error) {
      console.error("View story error:", error)
    }
  }

  static async reactToStory(
    storyId: string,
    reactorId: string,
    reactorName: string,
    reactorPhoto: string,
    reactionType: StoryReaction["reactionType"],
  ): Promise<void> {
    try {
      const reaction: StoryReaction = {
        id: Date.now().toString(),
        storyId,
        reactorId,
        reactorName,
        reactorPhoto,
        reactionType,
        createdAt: new Date(),
      }

      if (!supabase) {
        const story = this.stories.find((s) => s.id === storyId)
        if (story) {
          // Remove existing reaction from this user
          story.reactions = story.reactions.filter((r) => r.reactorId !== reactorId)
          story.reactions.push(reaction)
        }
        return
      }

      await supabase.from("story_reactions").upsert({
        story_id: storyId,
        reactor_id: reactorId,
        reaction_type: reactionType,
      })
    } catch (error) {
      console.error("React to story error:", error)
    }
  }

  static async createHighlight(
    userId: string,
    title: string,
    storyIds: string[],
    coverPhoto: string,
  ): Promise<StoryHighlight> {
    try {
      const highlight: StoryHighlight = {
        id: Date.now().toString(),
        userId,
        title,
        coverPhoto,
        stories: this.stories.filter((s) => storyIds.includes(s.id)),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      if (!supabase) {
        this.highlights.push(highlight)
        return highlight
      }

      const { data, error } = await supabase.from("story_highlights").insert({
        user_id: userId,
        title,
        cover_photo: coverPhoto,
        story_ids: storyIds,
      })

      if (error) throw error

      return highlight
    } catch (error) {
      console.error("Create highlight error:", error)
      throw error
    }
  }

  static async getUserHighlights(userId: string): Promise<StoryHighlight[]> {
    if (!supabase) {
      return this.highlights.filter((h) => h.userId === userId)
    }

    try {
      const { data, error } = await supabase
        .from("story_highlights")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Get user highlights error:", error)
      return []
    }
  }

  static getStoryAnalytics(story: Story) {
    return {
      views: story.views.length,
      reactions: story.reactions.length,
      reactionBreakdown: story.reactions.reduce(
        (acc, reaction) => {
          acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
      topViewers: story.views.slice(0, 10),
      engagementRate: story.views.length > 0 ? (story.reactions.length / story.views.length) * 100 : 0,
    }
  }
}
