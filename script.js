class VideoCallApp {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.remoteStream = null;
    this.isHost = false;
    this.isConnected = false;
    this.currentToken = "";

    // DOM elements
    this.tokenInput = document.getElementById("tokenInput");
    this.connectBtn = document.getElementById("connectBtn");
    this.status = document.getElementById("status");
    this.connectionPanel = document.getElementById("connectionPanel");
    this.videoContainer = document.getElementById("videoContainer");
    this.localVideo = document.getElementById("localVideo");
    this.remoteVideo = document.getElementById("remoteVideo");
    this.muteBtn = document.getElementById("muteBtn");
    this.videoBtn = document.getElementById("videoBtn");
    this.disconnectBtn = document.getElementById("disconnectBtn");

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.connectBtn.addEventListener("click", () => this.handleConnect());
    this.tokenInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleConnect();
      }
    });

    this.muteBtn.addEventListener("click", () => this.toggleMute());
    this.videoBtn.addEventListener("click", () => this.toggleVideo());
    this.disconnectBtn.addEventListener("click", () => this.disconnect());

    // Disable connect button if token is empty
    this.tokenInput.addEventListener("input", () => {
      this.connectBtn.disabled = this.tokenInput.value.trim() === "";
    });

    // Initial state
    this.connectBtn.disabled = true;
  }

  async handleConnect() {
    const token = this.tokenInput.value.trim();
    if (!token) {
      this.updateStatus("Vui lòng nhập token!", "error");
      return;
    }

    this.currentToken = token;
    this.connectBtn.disabled = true;
    this.updateStatus("Đang kết nối...", "connecting");

    try {
      // Initialize Peer.js with token as ID
      this.peer = new Peer(token, {
        host: "peerjs-server.herokuapp.com",
        port: 443,
        path: "/",
        secure: true,
      });

      this.peer.on("open", (id) => {
        console.log("Peer ID:", id);
        this.attemptConnection();
      });

      this.peer.on("error", (err) => {
        console.error("Peer error:", err);
        this.updateStatus(`Lỗi kết nối: ${err.message}`, "error");
        this.connectBtn.disabled = false;
      });
    } catch (error) {
      console.error("Error initializing peer:", error);
      this.updateStatus(`Lỗi khởi tạo: ${error.message}`, "error");
      this.connectBtn.disabled = false;
    }
  }

  async attemptConnection() {
    try {
      // Try to connect to existing peer with same token
      const conn = this.peer.connect(this.currentToken);

      conn.on("open", () => {
        console.log("Connected to existing peer");
        this.isHost = false;
        this.setupConnection(conn);
      });

      conn.on("error", () => {
        // If connection fails, this peer becomes the host
        console.log("No existing peer found, becoming host");
        this.isHost = true;
        this.setupHostMode();
      });
    } catch (error) {
      console.error("Connection attempt failed:", error);
      this.updateStatus("Lỗi kết nối", "error");
      this.connectBtn.disabled = false;
    }
  }

  setupHostMode() {
    this.peer.on("connection", (conn) => {
      console.log("New peer connected:", conn.peer);
      this.setupConnection(conn);
    });

    this.updateStatus("Đang chờ kết nối... (Host)", "connecting");
    this.startLocalStream();
  }

  setupConnection(conn) {
    this.isConnected = true;
    this.updateStatus("Đã kết nối thành công!", "connected");
    this.showVideoInterface();

    // Handle incoming calls
    this.peer.on("call", (call) => {
      console.log("Incoming call from:", call.peer);
      call.answer(this.localStream);

      call.on("stream", (stream) => {
        this.remoteStream = stream;
        this.remoteVideo.srcObject = stream;
      });

      call.on("close", () => {
        console.log("Call ended");
        this.handleCallEnd();
      });
    });

    // Make call if we're the joiner
    if (!this.isHost && this.localStream) {
      this.makeCall();
    }

    // Handle connection events
    conn.on("close", () => {
      console.log("Connection closed");
      this.handleCallEnd();
    });

    conn.on("error", (err) => {
      console.error("Connection error:", err);
      this.handleCallEnd();
    });
  }

  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      this.localVideo.srcObject = this.localStream;

      // If we're connected, make the call
      if (this.isConnected && !this.isHost) {
        this.makeCall();
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
      this.updateStatus("Không thể truy cập camera/microphone", "error");
      this.connectBtn.disabled = false;
    }
  }

  makeCall() {
    if (!this.localStream) return;

    const call = this.peer.call(this.currentToken, this.localStream);

    call.on("stream", (stream) => {
      this.remoteStream = stream;
      this.remoteVideo.srcObject = stream;
    });

    call.on("close", () => {
      console.log("Call ended");
      this.handleCallEnd();
    });

    call.on("error", (err) => {
      console.error("Call error:", err);
      this.handleCallEnd();
    });
  }

  showVideoInterface() {
    this.connectionPanel.style.display = "none";
    this.videoContainer.style.display = "block";

    if (!this.localStream) {
      this.startLocalStream();
    }
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

    if (this.peer) {
      this.peer.destroy();
    }

    this.resetInterface();
  }

  handleCallEnd() {
    this.updateStatus("Kết nối đã bị ngắt", "error");
    this.resetInterface();
  }

  resetInterface() {
    this.isConnected = false;
    this.isHost = false;
    this.localStream = null;
    this.remoteStream = null;

    this.localVideo.srcObject = null;
    this.remoteVideo.srcObject = null;

    this.connectionPanel.style.display = "block";
    this.videoContainer.style.display = "none";

    this.connectBtn.disabled = false;
    this.tokenInput.value = this.currentToken;

    this.muteBtn.textContent = "🔇";
    this.muteBtn.classList.remove("active");
    this.videoBtn.textContent = "📹";
    this.videoBtn.classList.remove("active");
  }

  updateStatus(message, type = "") {
    this.status.textContent = message;
    this.status.className = `status ${type}`;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new VideoCallApp();
});
