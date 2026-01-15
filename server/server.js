import express from 'express'
import 'dotenv/config.js'
import cors from 'cors'
import http from 'http'
import { connectDB } from './lib/db.js'
import userRouter from './routes/userRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import { Server } from 'socket.io'

// Create Express app and HTTP server
const app = express()
const server = http.createServer(app)

// Initialize Socket.io
export const io = new Server(server, {
    cors: { origin: "*" },
    // transports: ["websocket", "polling"]
})

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket.io connection handling
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);

    if (userId) userSocketMap[userId] = socket.id;

    // Emit online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // ✅ FIX: listen on socket, not io
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${userId}, Socket ID: ${socket.id}`);

        delete userSocketMap[userId];

        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});


// Middleware setup
app.use(express.json({ limit: '4mb' }));
app.use(cors())

// Routes Setup
app.use("/api/status", (req, res) => res.send("Server is live"))
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)

await connectDB()

const PORT = process.env.PORT || 5000
server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

