# 🎥 Video Call Applications - No Server Required

Tổng hợp các phương pháp tạo ứng dụng video call mà **không cần server trung gian**.

## 📋 Danh sách các phương pháp

### 1. **Peer.js với Multi-Server Fallback** 📁 `./`

- ✅ **Dễ sử dụng nhất**
- ✅ **Tự động retry nhiều server**
- ✅ **Có server local backup**
- ❌ **Vẫn cần server signaling**

### 2. **WebRTC Pure với QR Code** 📁 `./webrtc-pure/`

- ✅ **Hoàn toàn không cần server**
- ✅ **QR Code cho signaling**
- ✅ **P2P thuần túy**
- ❌ **Cần 2 thiết bị gần nhau**

### 3. **WebRTC với SDP Exchange** 📁 `./webrtc-sdp/`

- ✅ **Hoàn toàn không cần server**
- ✅ **Bảo mật cao nhất**
- ✅ **Hoạt động offline**
- ❌ **Phức tạp hơn (copy/paste)**

---

## 🚀 Hướng dẫn sử dụng từng phương pháp

### **Method 1: Peer.js (Khuyến nghị cho người mới)**

```bash
# Cài đặt và chạy
npm install
npm run dev

# Nếu server công khai không hoạt động, chạy server riêng:
npm run peer-server
```

**Cách dùng:**

1. Mở ứng dụng trên 2 máy tính
2. Nhập cùng một token
3. Nhấn "Kết nối"
4. Máy đầu tiên = Host, máy thứ hai = Joiner

---

### **Method 2: WebRTC Pure với QR Code**

```bash
# Chỉ cần mở file HTML
cd webrtc-pure
# Mở index.html bằng trình duyệt
```

**Cách dùng:**

1. **Host:** Nhấn "Tạo phòng mới" → Chia sẻ Room ID hoặc QR Code
2. **Guest:** Nhấn "Join phòng có sẵn" → Nhập Room ID hoặc quét QR
3. **Kết nối:** WebRTC tự động thiết lập P2P

**Ưu điểm:**

- Không cần server nào cả
- Chỉ dùng STUN servers miễn phí
- Hoạt động hoàn toàn offline sau khi kết nối

---

### **Method 3: WebRTC với SDP Exchange**

```bash
# Chỉ cần mở file HTML
cd webrtc-sdp
# Mở index.html bằng trình duyệt
```

**Cách dùng:**

1. **Người gọi:** Nhấn "Tôi là người gọi" → Copy SDP → Gửi cho người nhận
2. **Người nhận:** Nhấn "Tôi là người nhận" → Dán SDP → Copy Answer → Gửi lại
3. **Người gọi:** Dán Answer → Copy ICE → Gửi ICE
4. **Người nhận:** Dán ICE → Kết nối thành công!

**Ưu điểm:**

- Bảo mật cao nhất (không có server nào biết nội dung)
- Hoạt động hoàn toàn offline
- Không có giới hạn thời gian

---

## 🔧 So sánh các phương pháp

| Tính năng             | Peer.js    | WebRTC Pure | SDP Exchange |
| --------------------- | ---------- | ----------- | ------------ |
| **Độ khó**            | ⭐         | ⭐⭐        | ⭐⭐⭐       |
| **Không cần server**  | ❌         | ✅          | ✅           |
| **Bảo mật**           | ⭐⭐⭐     | ⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐   |
| **Dễ sử dụng**        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐    | ⭐⭐         |
| **Hoạt động offline** | ❌         | ✅          | ✅           |
| **Tốc độ kết nối**    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐    | ⭐⭐⭐       |

---

## 🛠️ Công nghệ sử dụng

### **WebRTC Core**

- `RTCPeerConnection` - Quản lý kết nối P2P
- `getUserMedia` - Truy cập camera/microphone
- `ICE` - NAT traversal
- `SDP` - Session Description Protocol

### **STUN Servers (Miễn phí)**

```javascript
iceServers: [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];
```

### **Libraries**

- **Peer.js**: Peer-to-peer connection library
- **QRCode.js**: Generate QR codes for signaling
- **WebRTC**: Native browser API

---

## 🌐 Khi nào sử dụng phương pháp nào?

### **Sử dụng Peer.js khi:**

- Cần ứng dụng nhanh chóng
- Người dùng không kỹ thuật
- Có thể chấp nhận phụ thuộc server
- Muốn tính năng đầy đủ (chat, file sharing, etc.)

### **Sử dụng WebRTC Pure khi:**

- Muốn hoàn toàn không phụ thuộc server
- Có thể chia sẻ QR Code
- Ứng dụng nhỏ, đơn giản
- Cần bảo mật cao

### **Sử dụng SDP Exchange khi:**

- Cần bảo mật tối đa
- Có thể trao đổi thông tin qua kênh khác (email, chat)
- Ứng dụng enterprise
- Không muốn phụ thuộc bất kỳ service nào

---

## 🔍 Troubleshooting

### **Lỗi kết nối chung:**

- Kiểm tra firewall/antivirus
- Thử trình duyệt khác (Chrome khuyến nghị)
- Kiểm tra kết nối internet
- Cho phép truy cập camera/microphone

### **Lỗi NAT/Firewall:**

- Thử STUN servers khác
- Sử dụng VPN
- Mở ports trên router
- Sử dụng TURN server (có phí)

### **Lỗi WebRTC:**

- Kiểm tra HTTPS (WebRTC yêu cầu secure context)
- Thử localhost hoặc 127.0.0.1
- Clear browser cache
- Disable extensions

---

## 📚 Tài liệu tham khảo

- [WebRTC Official Docs](https://webrtc.org/)
- [Peer.js Documentation](https://peerjs.com/docs/)
- [MDN WebRTC Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC Samples](https://webrtc.github.io/samples/)

---

## 🤝 Đóng góp

Nếu bạn có ý tưởng cải tiến hoặc tìm thấy bug, hãy tạo issue hoặc pull request!

---

**🎉 Chúc bạn thành công trong việc tạo ứng dụng video call!**
