class WebRTCPureVideoCall {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.roomId = null;
    this.isHost = false;
    this.isConnected = false;

    // STUN servers (miễn phí)
    this.iceServers = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
      ],
    };

    // DOM elements
    this.createRoomBtn = document.getElementById("createRoomBtn");
    this.joinRoomBtn = document.getElementById("joinRoomBtn");
    this.copyRoomId = document.getElementById("copyRoomId");
    this.joinWithId = document.getElementById("joinWithId");
    this.roomIdInput = document.getElementById("roomIdInput");
    this.roomIdDisplay = document.getElementById("roomIdDisplay");
    this.status = document.getElementById("status");
    this.localVideo = document.getElementById("localVideo");
    this.remoteVideo = document.getElementById("remoteVideo");
    this.muteBtn = document.getElementById("muteBtn");
    this.videoBtn = document.getElementById("videoBtn");
    this.disconnectBtn = document.getElementById("disconnectBtn");

    // Panels
    this.step1 = document.getElementById("step1");
    this.step2 = document.getElementById("step2");
    this.step3 = document.getElementById("step3");
    this.connectionPanel = document.getElementById("connectionPanel");
    this.videoContainer = document.getElementById("videoContainer");

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.createRoomBtn.addEventListener("click", () => this.createRoom());
    this.joinRoomBtn.addEventListener("click", () => this.showJoinForm());
    this.copyRoomId.addEventListener("click", () =>
      this.copyRoomIdToClipboard()
    );
    this.joinWithId.addEventListener("click", () => this.joinRoom());
    this.roomIdInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.joinRoom();
    });

    this.muteBtn.addEventListener("click", () => this.toggleMute());
    this.videoBtn.addEventListener("click", () => this.toggleVideo());
    this.disconnectBtn.addEventListener("click", () => this.disconnect());
  }

  async createRoom() {
    this.roomId = this.generateRoomId();
    this.isHost = true;

    this.updateStatus("Đang tạo phòng...", "connecting");

    try {
      // Start local stream
      await this.startLocalStream();

      // Create peer connection
      this.createPeerConnection();

      // Show room info
      this.showRoomInfo();

      this.updateStatus(
        "Phòng đã được tạo! Chia sẻ Room ID hoặc QR Code",
        "connected"
      );
    } catch (error) {
      console.error("Error creating room:", error);
      this.updateStatus("Lỗi tạo phòng: " + error.message, "error");
    }
  }

  showJoinForm() {
    this.step1.style.display = "none";
    this.step3.style.display = "block";
  }

  async joinRoom() {
    const roomId = this.roomIdInput.value.trim();
    if (!roomId) {
      this.updateStatus("Vui lòng nhập Room ID!", "error");
      return;
    }

    this.roomId = roomId;
    this.isHost = false;

    this.updateStatus("Đang join phòng...", "connecting");

    try {
      // Start local stream
      await this.startLocalStream();

      // Create peer connection
      this.createPeerConnection();

      // Show video interface
      this.showVideoInterface();

      this.updateStatus("Đã join phòng! Đang chờ kết nối...", "connecting");

      // For demo purposes, we'll simulate the connection
      // In a real app, you'd exchange SDP through QR code or other means
      setTimeout(() => {
        this.simulateConnection();
      }, 2000);
    } catch (error) {
      console.error("Error joining room:", error);
      this.updateStatus("Lỗi join phòng: " + error.message, "error");
    }
  }

  showRoomInfo() {
    this.step1.style.display = "none";
    this.step2.style.display = "block";

    this.roomIdDisplay.textContent = this.roomId;
    this.generateQRCode();

    // Show video interface for host
    this.showVideoInterface();
  }

  generateQRCode() {
    const qrContainer = document.getElementById("qrcode");
    qrContainer.innerHTML = "";

    // Create connection data
    const connectionData = {
      roomId: this.roomId,
      timestamp: Date.now(),
    };

    // Generate QR code
    QRCode.toCanvas(qrContainer, JSON.stringify(connectionData), {
      width: 200,
      margin: 2,
      color: {
        dark: "#667eea",
        light: "#ffffff",
      },
    });
  }

  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      this.localVideo.srcObject = this.localStream;

      // Add tracks to peer connection if it exists
      if (this.peerConnection) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection.addTrack(track, this.localStream);
        });
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      throw new Error("Không thể truy cập camera/microphone");
    }
  }

  createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(this.iceServers);

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log("Received remote stream");
      this.remoteStream = event.streams[0];
      this.remoteVideo.srcObject = this.remoteStream;
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE candidate:", event.candidate);
        // In a real app, you'd send this to the other peer
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", this.peerConnection.connectionState);
      if (this.peerConnection.connectionState === "connected") {
        this.updateStatus("Đã kết nối thành công!", "connected");
        this.isConnected = true;
      } else if (this.peerConnection.connectionState === "disconnected") {
        this.updateStatus("Kết nối bị ngắt", "error");
        this.isConnected = false;
      }
    };

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }
  }

  // Simulate connection for demo purposes
  async simulateConnection() {
    if (this.isHost) {
      // Host creates offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Simulate receiving answer
      setTimeout(async () => {
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setRemoteDescription(answer);
        this.updateStatus("Đã kết nối thành công!", "connected");
        this.isConnected = true;
      }, 1000);
    } else {
      // Guest creates answer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      setTimeout(async () => {
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setRemoteDescription(answer);
        this.updateStatus("Đã kết nối thành công!", "connected");
        this.isConnected = true;
      }, 1000);
    }
  }

  showVideoInterface() {
    this.connectionPanel.style.display = "none";
    this.videoContainer.style.display = "block";
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.muteBtn.textContent = audioTrack.enabled ? "🔇" : "🔊";
        this.muteBtn.classList.toggle("active", !audioTrack.enabled);
      }
    }
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.videoBtn.textContent = videoTrack.enabled ? "📹" : "📷";
        this.videoBtn.classList.toggle("active", !videoTrack.enabled);
      }
    }
  }

  disconnect() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }

    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.resetInterface();
  }

  resetInterface() {
    this.isConnected = false;
    this.isHost = false;
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.roomId = null;

    this.localVideo.srcObject = null;
    this.remoteVideo.srcObject = null;

    this.connectionPanel.style.display = "block";
    this.videoContainer.style.display = "none";

    this.step1.style.display = "block";
    this.step2.style.display = "none";
    this.step3.style.display = "none";

    this.roomIdInput.value = "";
    this.roomIdDisplay.textContent = "";

    this.muteBtn.textContent = "🔇";
    this.muteBtn.classList.remove("active");
    this.videoBtn.textContent = "📹";
    this.videoBtn.classList.remove("active");
  }

  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async copyRoomIdToClipboard() {
    try {
      await navigator.clipboard.writeText(this.roomId);
      this.updateStatus("Room ID đã được copy!", "connected");
    } catch (error) {
      console.error("Error copying room ID:", error);
      this.updateStatus("Không thể copy Room ID", "error");
    }
  }

  updateStatus(message, type = "") {
    this.status.textContent = message;
    this.status.className = `status ${type}`;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new WebRTCPureVideoCall();
});
