# Simple Video Call App

Ứng dụng video call đơn giản sử dụng Peer.js để kết nối trực tiếp giữa 2 máy tính.

## Tính năng

- ✅ Kết nối video call trực tiếp (P2P) không cần server
- ✅ Giao diện đơn giản, thân thiện với người dùng
- ✅ Hệ thống token để nhận dạng và kết nối
- ✅ Tự động phát hiện host/joiner
- ✅ Điều khiển âm thanh và video
- ✅ Responsive design cho mobile và desktop

## Cách sử dụng

### Cài đặt

1. Clone hoặc tải source code về máy
2. Cài đặt dependencies:

```bash
npm install
```

### Chạy ứng dụng

```bash
# Sử dụng live-server (khuyến nghị)
npm run dev

# Hoặc sử dụng http-server
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### Cách kết nối

1. **Mở ứng dụng trên 2 máy tính khác nhau**
2. **Nhập cùng một token** trên cả 2 máy (ví dụ: "abc123")
3. **Nhấn "Kết nối"** trên cả 2 máy
4. **Cho phép truy cập camera và microphone** khi được yêu cầu
5. **Máy đầu tiên kết nối sẽ trở thành host**, máy thứ hai sẽ tự động join

### Token System

- Token có thể là bất kỳ chuỗi nào (khuyến nghị 3-20 ký tự)
- Cùng một token = cùng một phòng video call
- Máy đầu tiên với token đó sẽ trở thành host
- Máy thứ hai sẽ tự động tìm và kết nối với host

## Công nghệ sử dụng

- **Peer.js**: Thư viện WebRTC để kết nối P2P
- **HTML5**: Video và audio elements
- **CSS3**: Giao diện responsive và animations
- **Vanilla JavaScript**: Logic xử lý kết nối và UI

## Lưu ý

- Cần kết nối internet để sử dụng
- Cần cho phép truy cập camera và microphone
- Hoạt động tốt nhất trên Chrome, Firefox, Safari
- Có thể cần mở port firewall cho kết nối P2P

## Troubleshooting

### Không thể kết nối

- Kiểm tra kết nối internet
- Thử token khác
- Refresh trang và thử lại
- Kiểm tra firewall/antivirus
- **Lỗi "Lost connection to server"**: Ứng dụng sẽ tự động thử nhiều server khác nhau

### Chạy Peer.js Server Local (Backup)

Nếu các server công khai không hoạt động, bạn có thể chạy server riêng:

```bash
# Cài đặt peer server
npm install

# Chạy peer server
npm run peer-server

# Server sẽ chạy tại http://localhost:9000
# Ứng dụng sẽ tự động thử kết nối đến server local này
```

### Không có âm thanh/video

- Cho phép truy cập camera và microphone
- Kiểm tra thiết bị audio/video
- Thử trình duyệt khác

### Kết nối bị ngắt

- Kiểm tra kết nối mạng
- Refresh trang
- Thử token mới

## Cấu trúc dự án

```
SimpleVideoCall/
├── index.html          # Giao diện chính
├── styles.css          # CSS styling
├── script.js           # Logic JavaScript
├── package.json        # Dependencies
└── README.md          # Hướng dẫn
```
