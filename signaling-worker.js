/**
 * WebRTC Signaling Server using Cloudflare Workers
 *
 * This worker handles WebRTC signaling between peers:
 * - WebSocket connections for real-time communication
 * - Room-based peer matching
 * - Offer/Answer exchange
 * - ICE candidate exchange
 *
 * Usage:
 * 1. Deploy this script to Cloudflare Workers
 * 2. Update your HTML to connect to the worker URL
 * 3. Enjoy real P2P video calls!
 */

// Store active connections by room ID
const rooms = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle WebSocket upgrade requests
    if (url.pathname === "/ws") {
      return handleWebSocket(request);
    }

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Return server info for GET requests
    if (request.method === "GET") {
      return new Response(
        JSON.stringify({
          name: "WebRTC Signaling Server",
          version: "1.0.0",
          status: "running",
          endpoints: {
            websocket: "/ws",
            info: "/",
          },
          rooms: rooms.size,
          totalConnections: Array.from(rooms.values()).reduce(
            (sum, room) => sum + room.size,
            0
          ),
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    return new Response("WebRTC Signaling Server", {
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      },
    });
  },
};

async function handleWebSocket(request) {
  // Check if request is a WebSocket upgrade
  const upgradeHeader = request.headers.get("Upgrade");
  if (upgradeHeader !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  // Create WebSocket pair
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  // Accept the WebSocket connection
  server.accept();

  // Handle WebSocket events
  server.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(server, data);
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
      server.send(
        JSON.stringify({
          type: "error",
          message: "Invalid JSON message",
        })
      );
    }
  });

  server.addEventListener("close", () => {
    console.log("WebSocket connection closed");
    removeConnectionFromAllRooms(server);
  });

  server.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
    removeConnectionFromAllRooms(server);
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

function handleWebSocketMessage(server, data) {
  console.log("Received message:", data.type, "from room:", data.roomId);

  switch (data.type) {
    case "join":
      handleJoinRoom(server, data);
      break;

    case "offer":
      handleOffer(server, data);
      break;

    case "answer":
      handleAnswer(server, data);
      break;

    case "ice-candidate":
      handleIceCandidate(server, data);
      break;

    case "leave":
      handleLeaveRoom(server, data);
      break;

    default:
      server.send(
        JSON.stringify({
          type: "error",
          message: `Unknown message type: ${data.type}`,
        })
      );
  }
}

function handleJoinRoom(server, data) {
  const { roomId, peerId } = data;

  if (!roomId || !peerId) {
    server.send(
      JSON.stringify({
        type: "error",
        message: "Room ID and Peer ID are required",
      })
    );
    return;
  }

  // Create room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Map());
  }

  const room = rooms.get(roomId);

  // Check if room is full (max 2 peers for video call)
  if (room.size >= 2) {
    server.send(
      JSON.stringify({
        type: "error",
        message: "Room is full (maximum 2 peers allowed)",
      })
    );
    return;
  }

  // Add peer to room
  room.set(peerId, server);

  // Store room and peer info on the connection
  server.roomId = roomId;
  server.peerId = peerId;

  console.log(`Peer ${peerId} joined room ${roomId}. Room size: ${room.size}`);

  // Notify peer about successful join
  server.send(
    JSON.stringify({
      type: "joined",
      roomId: roomId,
      peerId: peerId,
      roomSize: room.size,
    })
  );

  // Notify other peers in the room
  broadcastToRoom(
    roomId,
    {
      type: "peer-joined",
      peerId: peerId,
      roomSize: room.size,
    },
    server
  );

  // If this is the second peer, notify both peers they can start
  if (room.size === 2) {
    broadcastToRoom(roomId, {
      type: "ready",
      message: "Both peers connected, ready to start call",
    });
  }
}

function handleOffer(server, data) {
  const { roomId, offer, targetPeerId } = data;

  if (!roomId || !offer) {
    server.send(
      JSON.stringify({
        type: "error",
        message: "Room ID and offer are required",
      })
    );
    return;
  }

  console.log(`Forwarding offer from ${server.peerId} to room ${roomId}`);

  // Forward offer to other peers in the room
  broadcastToRoom(
    roomId,
    {
      type: "offer",
      offer: offer,
      fromPeerId: server.peerId,
      targetPeerId: targetPeerId,
    },
    server
  );
}

function handleAnswer(server, data) {
  const { roomId, answer, targetPeerId } = data;

  if (!roomId || !answer) {
    server.send(
      JSON.stringify({
        type: "error",
        message: "Room ID and answer are required",
      })
    );
    return;
  }

  console.log(`Forwarding answer from ${server.peerId} to room ${roomId}`);

  // Forward answer to other peers in the room
  broadcastToRoom(
    roomId,
    {
      type: "answer",
      answer: answer,
      fromPeerId: server.peerId,
      targetPeerId: targetPeerId,
    },
    server
  );
}

function handleIceCandidate(server, data) {
  const { roomId, candidate, targetPeerId } = data;

  if (!roomId || !candidate) {
    server.send(
      JSON.stringify({
        type: "error",
        message: "Room ID and candidate are required",
      })
    );
    return;
  }

  console.log(
    `Forwarding ICE candidate from ${server.peerId} to room ${roomId}`
  );

  // Forward ICE candidate to other peers in the room
  broadcastToRoom(
    roomId,
    {
      type: "ice-candidate",
      candidate: candidate,
      fromPeerId: server.peerId,
      targetPeerId: targetPeerId,
    },
    server
  );
}

function handleLeaveRoom(server, data) {
  const { roomId } = data;

  if (roomId) {
    removeConnectionFromRoom(server, roomId);
  } else {
    removeConnectionFromAllRooms(server);
  }

  server.send(
    JSON.stringify({
      type: "left",
      roomId: roomId || server.roomId,
    })
  );
}

function broadcastToRoom(roomId, message, excludeServer = null) {
  const room = rooms.get(roomId);
  if (!room) {
    console.log(`Room ${roomId} not found`);
    return;
  }

  let sentCount = 0;
  for (const [peerId, connection] of room) {
    if (
      connection !== excludeServer &&
      connection.readyState === WebSocket.OPEN
    ) {
      try {
        connection.send(JSON.stringify(message));
        sentCount++;
      } catch (error) {
        console.error(`Error sending message to peer ${peerId}:`, error);
        // Remove broken connection
        room.delete(peerId);
      }
    }
  }

  console.log(`Broadcasted message to ${sentCount} peers in room ${roomId}`);

  // Clean up empty rooms
  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`Removed empty room ${roomId}`);
  }
}

function removeConnectionFromRoom(server, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const peerId = server.peerId;
  if (peerId && room.has(peerId)) {
    room.delete(peerId);
    console.log(`Removed peer ${peerId} from room ${roomId}`);

    // Notify other peers about the disconnection
    broadcastToRoom(roomId, {
      type: "peer-left",
      peerId: peerId,
      roomSize: room.size,
    });
  }

  // Clean up empty rooms
  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`Removed empty room ${roomId}`);
  }
}

function removeConnectionFromAllRooms(server) {
  if (server.roomId) {
    removeConnectionFromRoom(server, server.roomId);
  }
}
