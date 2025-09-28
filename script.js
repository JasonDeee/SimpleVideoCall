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
    this.testStunBtn = document.getElementById("testStunBtn");
    this.status = document.getElementById("status");
    this.connectionPanel = document.getElementById("connectionPanel");
    this.videoContainer = document.getElementById("videoContainer");
    this.localVideo = document.getElementById("localVideo");
    this.remoteVideo = document.getElementById("remoteVideo");
    this.muteBtn = document.getElementById("muteBtn");
    this.videoBtn = document.getElementById("videoBtn");
    this.disconnectBtn = document.getElementById("disconnectBtn");

    this.checkWebRTCSupport();
    this.initializeEventListeners();
  }

  checkWebRTCSupport() {
    // Check if WebRTC is supported
    if (!window.RTCPeerConnection) {
      this.updateStatus(
        "Trình duyệt không hỗ trợ WebRTC. Vui lòng sử dụng Chrome, Firefox hoặc Safari.",
        "error"
      );
      this.connectBtn.disabled = true;
      return false;
    }

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.updateStatus(
        "Trình duyệt không hỗ trợ truy cập camera/microphone.",
        "error"
      );
      this.connectBtn.disabled = true;
      return false;
    }

    // Check if Peer.js is loaded
    if (typeof Peer === "undefined") {
      this.updateStatus(
        "Peer.js chưa được tải. Vui lòng kiểm tra kết nối internet.",
        "error"
      );
      this.connectBtn.disabled = true;
      return false;
    }

    console.log("✅ WebRTC support check passed");
    return true;
  }

  initializeEventListeners() {
    this.connectBtn.addEventListener("click", () => this.handleConnect());
    this.testStunBtn.addEventListener("click", () => this.handleTestSTUN());
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

  async handleTestSTUN() {
    this.testStunBtn.disabled = true;
    this.testStunBtn.textContent = "Đang test...";
    this.updateStatus("Đang kiểm tra STUN servers...", "connecting");

    const stunWorking = await this.testSTUNServers();

    if (stunWorking) {
      this.updateStatus("✅ STUN servers hoạt động bình thường", "connected");
    } else {
      this.updateStatus(
        "❌ STUN servers không hoạt động. Có thể gặp vấn đề với firewall/NAT",
        "error"
      );
    }

    this.testStunBtn.disabled = false;
    this.testStunBtn.textContent = "Test STUN";
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

    // Try multiple Peer.js servers with better STUN configuration
    const servers = [
      {
        host: "0.peerjs.com",
        port: 443,
        path: "/",
        secure: true,
      },
      {
        host: "peerjs-server.herokuapp.com",
        port: 443,
        path: "/",
        secure: true,
      },
      {
        host: "localhost",
        port: 9000,
        path: "/",
        secure: false,
      },
    ];

    await this.tryConnectToServers(token, servers);
  }

  async tryConnectToServers(token, servers) {
    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];
      this.updateStatus(
        `Đang thử server ${i + 1}/${servers.length}...`,
        "connecting"
      );

      try {
        await this.initializePeer(token, server);
        return; // Success, exit the loop
      } catch (error) {
        console.error(`Failed to connect to server ${i + 1}:`, error);

        // Add delay between retries
        if (i < servers.length - 1) {
          await this.delay(2000); // 2 second delay
        }

        if (i === servers.length - 1) {
          // Last server failed
          this.updateStatus(
            "Không thể kết nối đến bất kỳ server nào. Vui lòng thử lại sau hoặc chạy server local.",
            "error"
          );
          this.showRetryOptions();
        }
      }
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  showRetryOptions() {
    // Add retry button and local server option
    const retryBtn = document.createElement("button");
    retryBtn.textContent = "Thử lại";
    retryBtn.className = "retry-btn";
    retryBtn.style.cssText = `
      margin-top: 10px;
      padding: 8px 16px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    `;

    retryBtn.addEventListener("click", () => {
      retryBtn.remove();
      this.connectBtn.disabled = false;
      this.updateStatus("Chưa kết nối", "");
    });

    const localServerInfo = document.createElement("div");
    localServerInfo.innerHTML = `
      <p style="margin-top: 10px; font-size: 14px; color: #666;">
        💡 <strong>Gợi ý:</strong> Chạy server local bằng lệnh: <code>npm run peer-server</code>
      </p>
    `;

    this.status.parentNode.appendChild(retryBtn);
    this.status.parentNode.appendChild(localServerInfo);
  }

  async initializePeer(token, serverConfig) {
    return new Promise((resolve, reject) => {
      const config = {
        ...serverConfig,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
            { urls: "stun:stun.ekiga.net" },
            { urls: "stun:stun.ideasip.com" },
            { urls: "stun:stun.schlund.de" },
            { urls: "stun:stun.stunprotocol.org:3478" },
            { urls: "stun:stun.voiparound.com" },
            { urls: "stun:stun.voipbuster.com" },
            { urls: "stun:stun.voipstunt.com" },
            { urls: "stun:stun.counterpath.com" },
            { urls: "stun:stun.1und1.de" },
            { urls: "stun:stun.gmx.net" },
            { urls: "stun:stun.callwithus.com" },
            { urls: "stun:stun.counterpath.net" },
            { urls: "stun:stun.internetcalls.com" },
          ],
          iceCandidatePoolSize: 10,
        },
      };

      this.peer = new Peer(token, config);

      const timeout = setTimeout(() => {
        if (this.peer) {
          this.peer.destroy();
        }
        reject(new Error("Connection timeout"));
      }, 10000); // 10 second timeout

      this.peer.on("open", (id) => {
        clearTimeout(timeout);
        console.log("Peer ID:", id);
        this.attemptConnection();
        resolve();
      });

      this.peer.on("error", (err) => {
        clearTimeout(timeout);
        console.error("Peer error:", err);

        // Handle specific error types
        if (err.type === "peer-unavailable") {
          console.log("Peer unavailable - will retry with different approach");
        } else if (err.type === "network") {
          console.log("Network error - checking connectivity");
        } else if (err.type === "server-error") {
          console.log("Server error - trying next server");
        }

        reject(err);
      });
    });
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

      // Handle specific call errors
      if (err.type === "peer-unavailable") {
        this.updateStatus(
          "Người dùng không khả dụng. Vui lòng thử lại.",
          "error"
        );
      } else if (err.type === "network") {
        this.updateStatus("Lỗi mạng. Kiểm tra kết nối internet.", "error");
      } else if (err.type === "server-error") {
        this.updateStatus("Lỗi server. Thử server khác.", "error");
      } else {
        this.updateStatus("Lỗi kết nối cuộc gọi. Vui lòng thử lại.", "error");
      }

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

  async testSTUNServers() {
    console.log("🔍 Testing STUN servers...");

    const stunServers = [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
    ];

    for (const stunUrl of stunServers) {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: stunUrl }],
        });

        const promise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error("STUN test timeout"));
          }, 5000);

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              clearTimeout(timeout);
              resolve(true);
            }
          };

          pc.createDataChannel("test");
          pc.createOffer().then((offer) => pc.setLocalDescription(offer));
        });

        await promise;
        console.log(`✅ STUN server working: ${stunUrl}`);
        pc.close();
        return true;
      } catch (error) {
        console.log(`❌ STUN server failed: ${stunUrl}`, error);
      }
    }

    console.log("⚠️ All STUN servers failed");
    return false;
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
