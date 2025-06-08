export interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  city?: string
  country?: string
  address?: string
  timestamp: number
}

export interface LocationPermission {
  granted: boolean
  denied: boolean
  prompt: boolean
}

// Mock data for users (replace with your actual mock data)
const mockUsers = [
  { id: "1", location: { lat: 37.7749, lng: -122.4194 } }, // San Francisco
  { id: "2", location: { lat: 40.7128, lng: -74.006 } }, // New York
  { id: "3", location: { lat: 34.0522, lng: -118.2437 } }, // Los Angeles
]

// Mock Supabase client (replace with your actual Supabase client)
const supabase = {
  from: (table: string) => ({
    update: (data: any) => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
    }),
    select: (columns: string) => Promise.resolve({ data: [], error: null }),
    neq: (column: string, value: any) => Promise.resolve({ data: [], error: null }),
  }),
}

export class GeolocationService {
  private static currentLocation: LocationData | null = null
  private static watchId: number | null = null
  private static locationListeners: Array<(location: LocationData) => void> = []

  static async requestPermission(): Promise<LocationPermission> {
    try {
      if (!navigator.geolocation) {
        return { granted: false, denied: true, prompt: false }
      }

      // Check current permission status
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({ name: "geolocation" })

        return {
          granted: permission.state === "granted",
          denied: permission.state === "denied",
          prompt: permission.state === "prompt",
        }
      }

      // Fallback: try to get location to check permission
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve({ granted: true, denied: false, prompt: false }),
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              resolve({ granted: false, denied: true, prompt: false })
            } else {
              resolve({ granted: false, denied: false, prompt: true })
            }
          },
          { timeout: 5000 },
        )
      })
    } catch (error) {
      console.error("Location permission error:", error)
      return { granted: false, denied: true, prompt: false }
    }
  }

  static async getCurrentLocation(highAccuracy = false): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"))
        return
      }

      const options: PositionOptions = {
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 15000 : 10000,
        maximumAge: highAccuracy ? 0 : 300000, // 5 minutes cache for low accuracy
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          }

          // Reverse geocode to get address
          try {
            const addressData = await this.reverseGeocode(locationData.latitude, locationData.longitude)
            Object.assign(locationData, addressData)
          } catch (error) {
            console.warn("Reverse geocoding failed:", error)
          }

          this.currentLocation = locationData
          this.notifyLocationListeners(locationData)
          resolve(locationData)
        },
        (error) => {
          console.error("Geolocation error:", error)

          let errorMessage = "Failed to get location"
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied"
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location unavailable"
              break
            case error.TIMEOUT:
              errorMessage = "Location request timeout"
              break
          }

          reject(new Error(errorMessage))
        },
        options,
      )
    })
  }

  static async startLocationTracking(highAccuracy = false): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error("Geolocation not supported")
    }

    if (this.watchId !== null) {
      this.stopLocationTracking()
    }

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
    }

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }

        // Only reverse geocode if location changed significantly
        if (this.hasLocationChangedSignificantly(locationData)) {
          try {
            const addressData = await this.reverseGeocode(locationData.latitude, locationData.longitude)
            Object.assign(locationData, addressData)
          } catch (error) {
            console.warn("Reverse geocoding failed:", error)
          }
        } else if (this.currentLocation) {
          // Use cached address data
          locationData.city = this.currentLocation.city
          locationData.country = this.currentLocation.country
          locationData.address = this.currentLocation.address
        }

        this.currentLocation = locationData
        this.notifyLocationListeners(locationData)
      },
      (error) => {
        console.error("Location tracking error:", error)
      },
      options,
    )
  }

  static stopLocationTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  static async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<{
    city?: string
    country?: string
    address?: string
  }> {
    try {
      // Using a free geocoding service (in production, use Google Maps or similar)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      )

      if (!response.ok) {
        throw new Error("Geocoding request failed")
      }

      const data = await response.json()

      return {
        city: data.city || data.locality || data.principalSubdivision,
        country: data.countryName,
        address: data.localityInfo?.administrative?.[0]?.name || data.locality,
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)

      // Fallback to mock data based on coordinates
      return this.getMockLocationData(latitude, longitude)
    }
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    unit: "km" | "miles" = "km",
  ): number {
    const R = unit === "km" ? 6371 : 3959 // Earth's radius
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  static calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = this.toRadians(lon2 - lon1)
    const lat1Rad = this.toRadians(lat1)
    const lat2Rad = this.toRadians(lat2)

    const y = Math.sin(dLon) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon)

    const bearing = Math.atan2(y, x)
    return (this.toDegrees(bearing) + 360) % 360
  }

  static isWithinRadius(
    centerLat: number,
    centerLon: number,
    pointLat: number,
    pointLon: number,
    radiusKm: number,
  ): boolean {
    const distance = this.calculateDistance(centerLat, centerLon, pointLat, pointLon)
    return distance <= radiusKm
  }

  static async updateUserLocation(userId: string, location: LocationData): Promise<void> {
    try {
      if (!supabase) return

      await supabase
        .from("users")
        .update({
          location: {
            lat: location.latitude,
            lng: location.longitude,
            city: location.city,
            country: location.country,
            accuracy: location.accuracy,
            updated_at: new Date(location.timestamp).toISOString(),
          },
        })
        .eq("id", userId)
    } catch (error) {
      console.error("Update user location error:", error)
    }
  }

  static async getNearbyUsers(
    centerLat: number,
    centerLon: number,
    radiusKm: number,
    excludeUserId?: string,
  ): Promise<Array<{ user: any; distance: number }>> {
    try {
      if (!supabase) {
        // Return mock nearby users
        return mockUsers
          .filter((u) => u.id !== excludeUserId)
          .map((user) => ({
            user,
            distance: this.calculateDistance(centerLat, centerLon, user.location.lat, user.location.lng),
          }))
          .filter((item) => item.distance <= radiusKm)
          .sort((a, b) => a.distance - b.distance)
      }

      // In a real app with PostGIS, you'd use spatial queries
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .neq("id", excludeUserId || "")

      if (error) throw error

      const nearbyUsers = (users || [])
        .map((user) => ({
          user,
          distance: this.calculateDistance(centerLat, centerLon, user.location.lat, user.location.lng),
        }))
        .filter((item) => item.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)

      return nearbyUsers
    } catch (error) {
      console.error("Get nearby users error:", error)
      return []
    }
  }

  static onLocationUpdate(listener: (location: LocationData) => void): () => void {
    this.locationListeners.push(listener)
    return () => {
      this.locationListeners = this.locationListeners.filter((l) => l !== listener)
    }
  }

  static getCurrentLocationData(): LocationData | null {
    return this.currentLocation
  }

  private static hasLocationChangedSignificantly(newLocation: LocationData): boolean {
    if (!this.currentLocation) return true

    const distance = this.calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      newLocation.latitude,
      newLocation.longitude,
    )

    // Consider significant if moved more than 1km
    return distance > 1
  }

  private static notifyLocationListeners(location: LocationData): void {
    this.locationListeners.forEach((listener) => {
      try {
        listener(location)
      } catch (error) {
        console.error("Location listener error:", error)
      }
    })
  }

  private static getMockLocationData(
    lat: number,
    lon: number,
  ): {
    city?: string
    country?: string
    address?: string
  } {
    // Simple mock based on coordinates
    if (lat >= 37 && lat <= 38 && lon >= -123 && lon <= -122) {
      return { city: "San Francisco", country: "United States", address: "San Francisco, CA" }
    } else if (lat >= 40 && lat <= 41 && lon >= -75 && lon <= -73) {
      return { city: "New York", country: "United States", address: "New York, NY" }
    } else if (lat >= 34 && lat <= 35 && lon >= -119 && lon <= -117) {
      return { city: "Los Angeles", country: "United States", address: "Los Angeles, CA" }
    } else {
      return { city: "Unknown City", country: "Unknown Country", address: "Unknown Location" }
    }
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private static toDegrees(radians: number): number {
    return radians * (180 / Math.PI)
  }
}
