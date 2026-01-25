import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./db/index.js";
import { app } from "./App.js";

dotenv.config({
  path: "./.env",
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  },
});

// Store online users
const onlineUsers = new Map(); // userId -> { userId, name, socketId, lastSeen }

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join user room
  socket.on("user:join", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      // Update online status (will be updated with name when available)
      onlineUsers.set(userId, {
        userId,
        name: onlineUsers.get(userId)?.name || "Guest",
        socketId: socket.id,
        lastSeen: new Date().toISOString(),
        isOnline: true,
      });
      // Notify others
      socket.broadcast.emit("user:online", { userId });
      console.log(`User ${userId} joined room user:${userId}`);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    // Find and remove user
    for (const [userId, user] of onlineUsers.entries()) {
      if (user.socketId === socket.id) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("user:offline", { userId });
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Make io available to app
app.set("io", io);
app.set("onlineUsers", onlineUsers);

connectDB()
  .then(() => {
    httpServer.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
      console.log("Socket.IO initialized");
    });
  })
  .catch((err) => {
    console.error("mongoDb connection failed:", err);
  });
