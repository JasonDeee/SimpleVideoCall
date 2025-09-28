// Peer.js Server Setup
// Chạy file này để tạo một Peer.js server local
// npm install peer
// node peer-server.js

const { PeerServer } = require("peer");

const peerServer = PeerServer({
  port: 9000,
  path: "/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  allow_discovery: true,
  concurrent_limit: 5000,
  proxied: true,
  key: "peerjs",
});

console.log("Peer.js server đang chạy tại http://localhost:9000");
console.log("Để sử dụng server local, thay đổi cấu hình trong script.js");

peerServer.on("connection", (client) => {
  console.log(`Client connected: ${client.getId()}`);
});

peerServer.on("disconnect", (client) => {
  console.log(`Client disconnected: ${client.getId()}`);
});
