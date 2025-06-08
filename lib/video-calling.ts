import { supabase } from "./supabase"

export interface CallParticipant {
  id: string
  name: string
  photo: string
  stream?: MediaStream
}

export interface CallState {
  status: "idle" | "calling" | "ringing" | "connected" | "ended"
  participants: CallParticipant[]
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  duration: number
  error?: string
}

export class VideoCallingService {
  private static peerConnection: RTCPeerConnection | null = null
  private static localStream: MediaStream | null = null
  private static remoteStream: MediaStream | null = null
  private static signalingChannel: any = null
  private static callState: CallState = {
    status: "idle",
    participants: [],
    isVideoEnabled: true,
    isAudioEnabled: true,
    duration: 0,
  }
  private static stateListeners: Array<(state: CallState) => void> = []

  static async initializeCall(matchId: string, currentUser: CallParticipant): Promise<boolean> {
    try {
      // Initialize peer connection
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      }

      this.peerConnection = new RTCPeerConnection(configuration)

      // Set up event handlers
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignalingMessage({
            type: "ice-candidate",
            candidate: event.candidate,
            matchId,
          })
        }
      }

      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0]
        this.updateCallState({
          status: "connected",
          participants: [currentUser, { ...this.callState.participants[1], stream: this.remoteStream }],
        })
      }

      this.peerConnection.onconnectionstatechange = () => {
        console.log("Connection state:", this.peerConnection?.connectionState)

        if (this.peerConnection?.connectionState === "connected") {
          this.startCallTimer()
        } else if (
          this.peerConnection?.connectionState === "disconnected" ||
          this.peerConnection?.connectionState === "failed"
        ) {
          this.endCall()
        }
      }

      // Get user media
      await this.getUserMedia()

      // Set up signaling
      await this.setupSignaling(matchId)

      return true
    } catch (error) {
      console.error("Initialize call error:", error)
      this.updateCallState({
        status: "ended",
        error: "Failed to initialize call",
      })
      return false
    }
  }

  static async startCall(matchId: string, caller: CallParticipant, callee: CallParticipant): Promise<void> {
    try {
      this.updateCallState({
        status: "calling",
        participants: [caller, callee],
      })

      if (!this.peerConnection || !this.localStream) {
        throw new Error("Call not initialized")
      }

      // Add local stream to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!)
      })

      // Create offer
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })

      await this.peerConnection.setLocalDescription(offer)

      // Send offer via signaling
      await this.sendSignalingMessage({
        type: "offer",
        offer,
        matchId,
        caller: caller.id,
        callee: callee.id,
      })

      // Send call notification
      await this.sendCallNotification(callee, caller, "incoming")
    } catch (error) {
      console.error("Start call error:", error)
      this.endCall()
    }
  }

  static async answerCall(matchId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      this.updateCallState({ status: "connected" })

      if (!this.peerConnection || !this.localStream) {
        throw new Error("Call not initialized")
      }

      // Add local stream
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!)
      })

      // Set remote description
      await this.peerConnection.setRemoteDescription(offer)

      // Create answer
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      // Send answer
      await this.sendSignalingMessage({
        type: "answer",
        answer,
        matchId,
      })
    } catch (error) {
      console.error("Answer call error:", error)
      this.endCall()
    }
  }

  static async rejectCall(matchId: string): Promise<void> {
    await this.sendSignalingMessage({
      type: "reject",
      matchId,
    })
    this.endCall()
  }

  static async endCall(): Promise<void> {
    try {
      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop())
        this.localStream = null
      }

      // Close peer connection
      if (this.peerConnection) {
        this.peerConnection.close()
        this.peerConnection = null
      }

      // Clean up signaling
      if (this.signalingChannel) {
        this.signalingChannel.close()
        this.signalingChannel = null
      }

      this.updateCallState({
        status: "ended",
        participants: [],
        duration: 0,
      })
    } catch (error) {
      console.error("End call error:", error)
    }
  }

  static async toggleVideo(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !this.callState.isVideoEnabled
        this.updateCallState({
          isVideoEnabled: !this.callState.isVideoEnabled,
        })
      }
    }
  }

  static async toggleAudio(): Promise<void> {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !this.callState.isAudioEnabled
        this.updateCallState({
          isAudioEnabled: !this.callState.isAudioEnabled,
        })
      }
    }
  }

  static async switchCamera(): Promise<void> {
    try {
      if (!this.localStream) return

      const videoTrack = this.localStream.getVideoTracks()[0]
      if (!videoTrack) return

      // Get current constraints
      const constraints = videoTrack.getConstraints()
      const currentFacingMode = constraints.facingMode

      // Switch between front and back camera
      const newFacingMode = currentFacingMode === "user" ? "environment" : "user"

      // Stop current track
      videoTrack.stop()

      // Get new stream with switched camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: true,
      })

      // Replace track in peer connection
      const newVideoTrack = newStream.getVideoTracks()[0]
      const sender = this.peerConnection?.getSenders().find((s) => s.track && s.track.kind === "video")

      if (sender && newVideoTrack) {
        await sender.replaceTrack(newVideoTrack)
      }

      // Update local stream
      this.localStream.removeTrack(videoTrack)
      this.localStream.addTrack(newVideoTrack)
    } catch (error) {
      console.error("Switch camera error:", error)
    }
  }

  private static async getUserMedia(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      this.updateCallState({
        participants: [
          { ...this.callState.participants[0], stream: this.localStream },
          ...this.callState.participants.slice(1),
        ],
      })
    } catch (error) {
      console.error("Get user media error:", error)
      throw new Error("Failed to access camera/microphone")
    }
  }

  private static async setupSignaling(matchId: string): Promise<void> {
    // In a real app, this would connect to your signaling server
    // For demo, we'll use Supabase realtime or WebSocket

    this.signalingChannel = supabase
      .channel(`call-${matchId}`)
      .on("broadcast", { event: "signaling" }, (payload: { payload: any }) => {
        this.handleSignalingMessage(payload.payload)
      })
      .subscribe()
  }

  private static async sendSignalingMessage(message: any): Promise<void> {
    try {
      if (this.signalingChannel) {
        await this.signalingChannel.send({
          type: "broadcast",
          event: "signaling",
          payload: message,
        })
      }

      // Also send via API for reliability
      await fetch("/api/signaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      })
    } catch (error) {
      console.error("Send signaling message error:", error)
    }
  }

  private static async handleSignalingMessage(message: any): Promise<void> {
    try {
      switch (message.type) {
        case "offer":
          if (this.callState.status === "idle") {
            this.updateCallState({ status: "ringing" })
            // Show incoming call UI
            this.showIncomingCallUI(message)
          }
          break

        case "answer":
          if (this.peerConnection && message.answer) {
            await this.peerConnection.setRemoteDescription(message.answer)
          }
          break

        case "ice-candidate":
          if (this.peerConnection && message.candidate) {
            await this.peerConnection.addIceCandidate(message.candidate)
          }
          break

        case "reject":
          this.updateCallState({
            status: "ended",
            error: "Call rejected",
          })
          break

        case "end":
          this.endCall()
          break
      }
    } catch (error) {
      console.error("Handle signaling message error:", error)
    }
  }

  private static showIncomingCallUI(message: any): void {
    // Emit event for UI to show incoming call
    window.dispatchEvent(
      new CustomEvent("incomingCall", {
        detail: {
          matchId: message.matchId,
          caller: message.caller,
          offer: message.offer,
        },
      }),
    )
  }

  private static async sendCallNotification(
    recipient: CallParticipant,
    caller: CallParticipant,
    type: "incoming" | "missed",
  ): Promise<void> {
    try {
      await fetch("/api/call-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: recipient.id,
          callerId: caller.id,
          callerName: caller.name,
          callerPhoto: caller.photo,
          type,
        }),
      })
    } catch (error) {
      console.error("Send call notification error:", error)
    }
  }

  private static startCallTimer(): void {
    const startTime = Date.now()
    const timer = setInterval(() => {
      if (this.callState.status === "connected") {
        const duration = Math.floor((Date.now() - startTime) / 1000)
        this.updateCallState({ duration })
      } else {
        clearInterval(timer)
      }
    }, 1000)
  }

  private static updateCallState(updates: Partial<CallState>): void {
    this.callState = { ...this.callState, ...updates }
    this.stateListeners.forEach((listener) => listener(this.callState))
  }

  static onStateChange(listener: (state: CallState) => void): () => void {
    this.stateListeners.push(listener)
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener)
    }
  }

  static getCallState(): CallState {
    return this.callState
  }
}
