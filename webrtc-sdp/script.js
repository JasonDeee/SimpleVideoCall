class WebRTCSDPExchange {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.isInitiator = false;
    this.isConnected = false;
    this.pendingIceCandidates = [];

    // STUN servers
    this.iceServers = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    };

    // DOM elements
    this.initiateBtn = document.getElementById("initiateBtn");
    this.receiveBtn = document.getElementById("receiveBtn");
    this.sdpTextarea = document.getElementById("sdpTextarea");
    this.iceTextarea = document.getElementById("iceTextarea");
    this.copySdp = document.getElementById("copySdp");
    this.pasteSdp = document.getElementById("pasteSdp");
    this.processSdp = document.getElementById("processSdp");
    this.copyIce = document.getElementById("copyIce");
    this.pasteIce = document.getElementById("pasteIce");
    this.processIce = document.getElementById("processIce");
    this.status = document.getElementById("status");
    this.localVideo = document.getElementById("localVideo");
    this.remoteVideo = document.getElementById("remoteVideo");
    this.muteBtn = document.getElementById("muteBtn");
    this.videoBtn = document.getElementById("videoBtn");
    this.disconnectBtn = document.getElementById("disconnectBtn");

    // Panels
    this.step1 = document.getElementById("step1");
    this.step2 = document.getElementById("step2");
    this.connectionPanel = document.getElementById("connectionPanel");
    this.videoContainer = document.getElementById("videoContainer");

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.initiateBtn.addEventListener("click", () => this.initiateCall());
    this.receiveBtn.addEventListener("click", () => this.receiveCall());
    this.copySdp.addEventListener("click", () => this.copySDP());
    this.pasteSdp.addEventListener("click", () => this.pasteSDP());
    this.processSdp.addEventListener("click", () => this.processSDP());
    this.copyIce.addEventListener("click", () => this.copyICE());
    this.pasteIce.addEventListener("click", () => this.pasteICE());
    this.processIce.addEventListener("click", () => this.processICE());

    this.muteBtn.addEventListener("click", () => this.toggleMute());
    this.videoBtn.addEventListener("click", () => this.toggleVideo());
    this.disconnectBtn.addEventListener("click", () => this.disconnect());
  }

  async initiateCall() {
    this.isInitiator = true;
    this.updateStatus("Đang khởi tạo cuộc gọi...", "connecting");

    try {
      await this.startLocalStream();
      this.createPeerConnection();
      await this.createOffer();
      this.showExchangeInterface();
      this.updateStatus(
        "Đã tạo Offer! Copy SDP và gửi cho người nhận.",
        "connected"
      );
    } catch (error) {
      console.error("Error initiating call:", error);
      this.updateStatus("Lỗi khởi tạo: " + error.message, "error");
    }
  }

  async receiveCall() {
    this.isInitiator = false;
    this.updateStatus("Sẵn sàng nhận cuộc gọi...", "connecting");

    try {
      await this.startLocalStream();
      this.createPeerConnection();
      this.showExchangeInterface();
      this.updateStatus("Sẵn sàng! Dán SDP Offer từ người gọi.", "connected");
    } catch (error) {
      console.error("Error receiving call:", error);
      this.updateStatus("Lỗi khởi tạo: " + error.message, "error");
    }
  }

  async startLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      this.localVideo.srcObject = this.localStream;
      this.showVideoInterface();

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
      this.updateStatus("Đã nhận video từ người kia!", "connected");
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("ICE candidate generated:", event.candidate);
        const candidateString = JSON.stringify(event.candidate);

        // Update ICE textarea
        if (this.iceTextarea.value) {
          this.iceTextarea.value += "\n" + candidateString;
        } else {
          this.iceTextarea.value = candidateString;
        }
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

  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    const offerString = JSON.stringify(offer);
    this.sdpTextarea.value = offerString;
    this.updateStatus(
      "Offer đã được tạo! Copy và gửi cho người nhận.",
      "connected"
    );
  }

  async processSDP() {
    const sdpString = this.sdpTextarea.value.trim();
    if (!sdpString) {
      this.updateStatus("Vui lòng nhập SDP!", "error");
      return;
    }

    try {
      const sdp = JSON.parse(sdpString);

      if (this.isInitiator) {
        // We're the initiator, this should be an answer
        await this.peerConnection.setRemoteDescription(sdp);
        this.updateStatus("Đã nhận Answer! Copy ICE và gửi.", "connected");

        // Process any pending ICE candidates
        for (const candidate of this.pendingIceCandidates) {
          await this.peerConnection.addIceCandidate(candidate);
        }
        this.pendingIceCandidates = [];
      } else {
        // We're the receiver, this should be an offer
        await this.peerConnection.setRemoteDescription(sdp);
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        const answerString = JSON.stringify(answer);
        this.sdpTextarea.value = answerString;
        this.updateStatus(
          "Đã tạo Answer! Copy và gửi lại cho người gọi.",
          "connected"
        );
      }
    } catch (error) {
      console.error("Error processing SDP:", error);
      this.updateStatus("Lỗi xử lý SDP: " + error.message, "error");
    }
  }

  async processICE() {
    const iceString = this.iceTextarea.value.trim();
    if (!iceString) {
      this.updateStatus("Vui lòng nhập ICE candidates!", "error");
      return;
    }

    try {
      const iceLines = iceString.split("\n").filter((line) => line.trim());

      for (const line of iceLines) {
        const candidate = JSON.parse(line);
        await this.peerConnection.addIceCandidate(candidate);
      }

      this.updateStatus("Đã thêm ICE candidates!", "connected");
    } catch (error) {
      console.error("Error processing ICE:", error);
      this.updateStatus("Lỗi xử lý ICE: " + error.message, "error");
    }
  }

  copySDP() {
    this.sdpTextarea.select();
    document.execCommand("copy");
    this.updateStatus("SDP đã được copy!", "connected");
  }

  pasteSDP() {
    navigator.clipboard
      .readText()
      .then((text) => {
        this.sdpTextarea.value = text;
        this.updateStatus("SDP đã được dán!", "connected");
      })
      .catch((err) => {
        console.error("Failed to read clipboard: ", err);
        this.updateStatus("Không thể đọc clipboard", "error");
      });
  }

  copyICE() {
    this.iceTextarea.select();
    document.execCommand("copy");
    this.updateStatus("ICE candidates đã được copy!", "connected");
  }

  pasteICE() {
    navigator.clipboard
      .readText()
      .then((text) => {
        this.iceTextarea.value = text;
        this.updateStatus("ICE candidates đã được dán!", "connected");
      })
      .catch((err) => {
        console.error("Failed to read clipboard: ", err);
        this.updateStatus("Không thể đọc clipboard", "error");
      });
  }

  showExchangeInterface() {
    this.step1.style.display = "none";
    this.step2.style.display = "block";
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
    this.isInitiator = false;
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.pendingIceCandidates = [];

    this.localVideo.srcObject = null;
    this.remoteVideo.srcObject = null;

    this.connectionPanel.style.display = "block";
    this.videoContainer.style.display = "none";

    this.step1.style.display = "block";
    this.step2.style.display = "none";

    this.sdpTextarea.value = "";
    this.iceTextarea.value = "";

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
  new WebRTCSDPExchange();
});
