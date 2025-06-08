import { supabase } from "./supabase"

export interface InstagramProfile {
  id: string
  username: string
  displayName: string
  followerCount: number
  followingCount: number
  postCount: number
  profilePicture: string
  isVerified: boolean
  bio: string
  website?: string
}

export interface InstagramPhoto {
  id: string
  url: string
  caption: string
  likeCount: number
  timestamp: Date
  isVideo: boolean
}

export interface SpotifyProfile {
  id: string
  displayName: string
  followerCount: number
  profileImage: string
  country: string
  isPremium: boolean
}

export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  album: string
  imageUrl: string
  previewUrl?: string
  popularity: number
  danceability: number
  energy: number
  valence: number
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  imageUrl: string
  trackCount: number
  isPublic: boolean
}

export interface MusicCompatibility {
  score: number
  commonArtists: string[]
  commonGenres: string[]
  energyMatch: number
  danceabilityMatch: number
  explanation: string
}

export class SocialIntegrationsService {
  // Instagram Integration
  static async connectInstagram(userId: string): Promise<{ success: boolean; authUrl?: string; error?: string }> {
    try {
      // In a real app, this would redirect to Instagram OAuth
      const authUrl = `https://api.instagram.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&scope=user_profile,user_media&response_type=code`

      return {
        success: true,
        authUrl,
      }
    } catch (error) {
      console.error("Instagram connection error:", error)
      return {
        success: false,
        error: "Failed to connect to Instagram. Please try again.",
      }
    }
  }

  static async getInstagramProfile(accessToken: string): Promise<InstagramProfile | null> {
    try {
      // Mock Instagram profile data for demo
      const mockProfile: InstagramProfile = {
        id: "instagram_" + Date.now(),
        username: "user_" + Math.random().toString(36).substr(2, 8),
        displayName: "John Doe",
        followerCount: Math.floor(Math.random() * 5000) + 100,
        followingCount: Math.floor(Math.random() * 1000) + 50,
        postCount: Math.floor(Math.random() * 500) + 20,
        profilePicture: "/placeholder.svg?height=150&width=150",
        isVerified: Math.random() > 0.8,
        bio: "Living life to the fullest 🌟 Travel enthusiast 📸",
        website: Math.random() > 0.7 ? "https://example.com" : undefined,
      }

      // In production, make actual API call
      // const response = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`)
      // const data = await response.json()

      return mockProfile
    } catch (error) {
      console.error("Get Instagram profile error:", error)
      return null
    }
  }

  static async getInstagramPhotos(accessToken: string, limit = 12): Promise<InstagramPhoto[]> {
    try {
      // Mock Instagram photos for demo
      const mockPhotos: InstagramPhoto[] = Array.from({ length: limit }, (_, i) => ({
        id: `photo_${i}`,
        url: `/placeholder.svg?height=400&width=400&text=Photo${i + 1}`,
        caption: `Amazing moment captured! #life #photography ${Math.random() > 0.5 ? "#travel" : "#friends"}`,
        likeCount: Math.floor(Math.random() * 1000) + 10,
        timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        isVideo: Math.random() > 0.8,
      }))

      // In production, make actual API call
      // const response = await fetch(`https://graph.instagram.com/me/media?fields=id,media_type,media_url,caption,like_count,timestamp&limit=${limit}&access_token=${accessToken}`)
      // const data = await response.json()

      return mockPhotos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    } catch (error) {
      console.error("Get Instagram photos error:", error)
      return []
    }
  }

  // Spotify Integration
  static async connectSpotify(userId: string): Promise<{ success: boolean; authUrl?: string; error?: string }> {
    try {
      // In a real app, this would redirect to Spotify OAuth
      const scopes = [
        "user-read-private",
        "user-read-email",
        "user-top-read",
        "user-read-recently-played",
        "playlist-read-private",
        "user-library-read",
      ].join(" ")

      const authUrl = `https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&scope=${encodeURIComponent(scopes)}`

      return {
        success: true,
        authUrl,
      }
    } catch (error) {
      console.error("Spotify connection error:", error)
      return {
        success: false,
        error: "Failed to connect to Spotify. Please try again.",
      }
    }
  }

  static async getSpotifyProfile(accessToken: string): Promise<SpotifyProfile | null> {
    try {
      // Mock Spotify profile for demo
      const mockProfile: SpotifyProfile = {
        id: "spotify_" + Date.now(),
        displayName: "Music Lover",
        followerCount: Math.floor(Math.random() * 1000) + 10,
        profileImage: "/placeholder.svg?height=150&width=150",
        country: "US",
        isPremium: Math.random() > 0.5,
      }

      // In production, make actual API call
      // const response = await fetch('https://api.spotify.com/v1/me', {
      //   headers: { Authorization: `Bearer ${accessToken}` }
      // })
      // const data = await response.json()

      return mockProfile
    } catch (error) {
      console.error("Get Spotify profile error:", error)
      return null
    }
  }

  static async getTopTracks(accessToken: string, timeRange = "medium_term", limit = 10): Promise<SpotifyTrack[]> {
    try {
      // Mock top tracks for demo
      const artists = [
        "Taylor Swift",
        "Ed Sheeran",
        "Billie Eilish",
        "The Weeknd",
        "Ariana Grande",
        "Post Malone",
        "Dua Lipa",
        "Harry Styles",
      ]
      const genres = ["pop", "rock", "hip-hop", "electronic", "indie", "r&b"]

      const mockTracks: SpotifyTrack[] = Array.from({ length: limit }, (_, i) => ({
        id: `track_${i}`,
        name: `Song ${i + 1}`,
        artist: artists[Math.floor(Math.random() * artists.length)],
        album: `Album ${i + 1}`,
        imageUrl: `/placeholder.svg?height=300&width=300&text=Album${i + 1}`,
        previewUrl: Math.random() > 0.3 ? `https://example.com/preview${i}.mp3` : undefined,
        popularity: Math.floor(Math.random() * 100),
        danceability: Math.random(),
        energy: Math.random(),
        valence: Math.random(),
      }))

      // In production, make actual API call
      // const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`, {
      //   headers: { Authorization: `Bearer ${accessToken}` }
      // })
      // const data = await response.json()

      return mockTracks
    } catch (error) {
      console.error("Get top tracks error:", error)
      return []
    }
  }

  static async getTopArtists(accessToken: string, timeRange = "medium_term", limit = 10): Promise<string[]> {
    try {
      // Mock top artists for demo
      const artists = [
        "Taylor Swift",
        "Ed Sheeran",
        "Billie Eilish",
        "The Weeknd",
        "Ariana Grande",
        "Post Malone",
        "Dua Lipa",
        "Harry Styles",
        "Drake",
        "Olivia Rodrigo",
      ]

      return artists.slice(0, limit)
    } catch (error) {
      console.error("Get top artists error:", error)
      return []
    }
  }

  static async getUserPlaylists(accessToken: string, limit = 20): Promise<SpotifyPlaylist[]> {
    try {
      // Mock playlists for demo
      const playlistNames = [
        "My Favorites",
        "Workout Hits",
        "Chill Vibes",
        "Road Trip",
        "Study Music",
        "Party Mix",
        "Throwback Thursday",
        "Indie Discoveries",
      ]

      const mockPlaylists: SpotifyPlaylist[] = playlistNames.slice(0, limit).map((name, i) => ({
        id: `playlist_${i}`,
        name,
        description: `My ${name.toLowerCase()} collection`,
        imageUrl: `/placeholder.svg?height=300&width=300&text=${name.replace(" ", "")}`,
        trackCount: Math.floor(Math.random() * 200) + 10,
        isPublic: Math.random() > 0.5,
      }))

      return mockPlaylists
    } catch (error) {
      console.error("Get user playlists error:", error)
      return []
    }
  }

  // Music Compatibility Analysis
  static calculateMusicCompatibility(user1Tracks: SpotifyTrack[], user2Tracks: SpotifyTrack[]): MusicCompatibility {
    try {
      // Extract artists and calculate common ones
      const user1Artists = user1Tracks.map((track) => track.artist.toLowerCase())
      const user2Artists = user2Tracks.map((track) => track.artist.toLowerCase())
      const commonArtists = user1Artists.filter((artist) => user2Artists.includes(artist))

      // Calculate audio feature similarities
      const user1AvgEnergy = user1Tracks.reduce((sum, track) => sum + track.energy, 0) / user1Tracks.length
      const user2AvgEnergy = user2Tracks.reduce((sum, track) => sum + track.energy, 0) / user2Tracks.length
      const energyMatch = 1 - Math.abs(user1AvgEnergy - user2AvgEnergy)

      const user1AvgDance = user1Tracks.reduce((sum, track) => sum + track.danceability, 0) / user1Tracks.length
      const user2AvgDance = user2Tracks.reduce((sum, track) => sum + track.danceability, 0) / user2Tracks.length
      const danceabilityMatch = 1 - Math.abs(user1AvgDance - user2AvgDance)

      // Calculate overall compatibility score
      const artistScore = (commonArtists.length / Math.max(user1Artists.length, user2Artists.length)) * 100
      const audioScore = ((energyMatch + danceabilityMatch) / 2) * 100
      const overallScore = artistScore * 0.6 + audioScore * 0.4

      // Generate explanation
      let explanation = ""
      if (overallScore >= 80) {
        explanation = "🎵 Amazing music compatibility! You both have very similar taste in music."
      } else if (overallScore >= 60) {
        explanation = "🎶 Good music match! You share some favorite artists and similar vibes."
      } else if (overallScore >= 40) {
        explanation = "🎼 Some musical overlap! You might discover new favorites together."
      } else {
        explanation = "🎸 Different music styles! Could be fun to explore each other's playlists."
      }

      if (commonArtists.length > 0) {
        explanation += ` You both love ${commonArtists.slice(0, 3).join(", ")}.`
      }

      return {
        score: Math.round(overallScore),
        commonArtists: [...new Set(commonArtists)],
        commonGenres: [], // Would be calculated from actual genre data
        energyMatch: Math.round(energyMatch * 100),
        danceabilityMatch: Math.round(danceabilityMatch * 100),
        explanation,
      }
    } catch (error) {
      console.error("Calculate music compatibility error:", error)
      return {
        score: 0,
        commonArtists: [],
        commonGenres: [],
        energyMatch: 0,
        danceabilityMatch: 0,
        explanation: "Unable to calculate music compatibility.",
      }
    }
  }

  // Save social media data
  static async saveInstagramData(userId: string, profile: InstagramProfile, photos: InstagramPhoto[]): Promise<void> {
    try {
      if (supabase) {
        // Save Instagram profile
        await supabase.from("instagram_profiles").upsert({
          user_id: userId,
          instagram_id: profile.id,
          username: profile.username,
          display_name: profile.displayName,
          follower_count: profile.followerCount,
          following_count: profile.followingCount,
          post_count: profile.postCount,
          profile_picture: profile.profilePicture,
          is_verified: profile.isVerified,
          bio: profile.bio,
          website: profile.website,
          updated_at: new Date().toISOString(),
        })

        // Save Instagram photos
        for (const photo of photos) {
          await supabase.from("instagram_photos").upsert({
            user_id: userId,
            instagram_photo_id: photo.id,
            url: photo.url,
            caption: photo.caption,
            like_count: photo.likeCount,
            timestamp: photo.timestamp.toISOString(),
            is_video: photo.isVideo,
          })
        }
      }
    } catch (error) {
      console.error("Save Instagram data error:", error)
    }
  }

  static async saveSpotifyData(
    userId: string,
    profile: SpotifyProfile,
    topTracks: SpotifyTrack[],
    topArtists: string[],
    playlists: SpotifyPlaylist[],
  ): Promise<void> {
    try {
      if (supabase) {
        // Save Spotify profile
        await supabase.from("spotify_profiles").upsert({
          user_id: userId,
          spotify_id: profile.id,
          display_name: profile.displayName,
          follower_count: profile.followerCount,
          profile_image: profile.profileImage,
          country: profile.country,
          is_premium: profile.isPremium,
          updated_at: new Date().toISOString(),
        })

        // Save top tracks
        for (const track of topTracks) {
          await supabase.from("spotify_tracks").upsert({
            user_id: userId,
            spotify_track_id: track.id,
            name: track.name,
            artist: track.artist,
            album: track.album,
            image_url: track.imageUrl,
            preview_url: track.previewUrl,
            popularity: track.popularity,
            danceability: track.danceability,
            energy: track.energy,
            valence: track.valence,
          })
        }

        // Save top artists
        await supabase.from("spotify_artists").delete().eq("user_id", userId)
        for (const artist of topArtists) {
          await supabase.from("spotify_artists").insert({
            user_id: userId,
            artist_name: artist,
          })
        }
      }
    } catch (error) {
      console.error("Save Spotify data error:", error)
    }
  }

  // Get saved social media data
  static async getInstagramData(
    userId: string,
  ): Promise<{ profile: InstagramProfile | null; photos: InstagramPhoto[] }> {
    try {
      if (supabase) {
        const { data: profileData } = await supabase
          .from("instagram_profiles")
          .select("*")
          .eq("user_id", userId)
          .single()

        const { data: photosData } = await supabase
          .from("instagram_photos")
          .select("*")
          .eq("user_id", userId)
          .order("timestamp", { ascending: false })
          .limit(12)

        const profile = profileData
          ? {
              id: profileData.instagram_id,
              username: profileData.username,
              displayName: profileData.display_name,
              followerCount: profileData.follower_count,
              followingCount: profileData.following_count,
              postCount: profileData.post_count,
              profilePicture: profileData.profile_picture,
              isVerified: profileData.is_verified,
              bio: profileData.bio,
              website: profileData.website,
            }
          : null

        const photos =
          photosData?.map((photo) => ({
            id: photo.instagram_photo_id,
            url: photo.url,
            caption: photo.caption,
            likeCount: photo.like_count,
            timestamp: new Date(photo.timestamp),
            isVideo: photo.is_video,
          })) || []

        return { profile, photos }
      }

      return { profile: null, photos: [] }
    } catch (error) {
      console.error("Get Instagram data error:", error)
      return { profile: null, photos: [] }
    }
  }

  static async getSpotifyData(userId: string): Promise<{
    profile: SpotifyProfile | null
    topTracks: SpotifyTrack[]
    topArtists: string[]
  }> {
    try {
      if (supabase) {
        const { data: profileData } = await supabase.from("spotify_profiles").select("*").eq("user_id", userId).single()

        const { data: tracksData } = await supabase.from("spotify_tracks").select("*").eq("user_id", userId).limit(10)

        const { data: artistsData } = await supabase.from("spotify_artists").select("artist_name").eq("user_id", userId)

        const profile = profileData
          ? {
              id: profileData.spotify_id,
              displayName: profileData.display_name,
              followerCount: profileData.follower_count,
              profileImage: profileData.profile_image,
              country: profileData.country,
              isPremium: profileData.is_premium,
            }
          : null

        const topTracks =
          tracksData?.map((track) => ({
            id: track.spotify_track_id,
            name: track.name,
            artist: track.artist,
            album: track.album,
            imageUrl: track.image_url,
            previewUrl: track.preview_url,
            popularity: track.popularity,
            danceability: track.danceability,
            energy: track.energy,
            valence: track.valence,
          })) || []

        const topArtists = artistsData?.map((item) => item.artist_name) || []

        return { profile, topTracks, topArtists }
      }

      return { profile: null, topTracks: [], topArtists: [] }
    } catch (error) {
      console.error("Get Spotify data error:", error)
      return { profile: null, topTracks: [], topArtists: [] }
    }
  }
}
