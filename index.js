import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import User from './models/user.model.js'; // Import User model

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS configuration for production
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', // Vite dev server
    'http://localhost:3001', // Your custom Vite port
    'http://127.0.0.1:5173', // Vite dev server IP
    'https://temchat.netlify.app',
    'https://chat-applicaton-sever.onrender.com'
];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('🚫 CORS Blocked Origin:', origin); // Log the blocked origin
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

// Serve static files from uploads directory
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import messageRoutes from './routes/message.routes.js';
import uploadRoutes from './routes/upload.routes.js';

app.use('/api/user', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/upload', uploadRoutes);

// Database Connection
const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const PORT = process.env.PORT || 5000;
        httpServer.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};

startServer();

// Socket.io Connection
io.on("connection", (socket) => {
    console.log("🔌 Connected to socket.io");

    socket.on("setup", (userData) => {
        socket.join(userData._id);
        socket.emit("connected");

        // Update user status to online
        User.findByIdAndUpdate(userData._id, {
            isOnline: true,
            lastSeen: new Date()
        }).then(() => {
            // Notify other users
            socket.broadcast.emit("user-online", { userId: userData._id });
        });
    });

    socket.on("join chat", (room) => {
        socket.join(room);
        console.log("User Joined Room: " + room);
    });

    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("new message", (newMessageRecieved) => {
        var chat = newMessageRecieved.chat;

        if (!chat.users) return console.log("chat.users not defined");

        chat.users.forEach((user) => {
            if (user._id == newMessageRecieved.sender._id) return;

            socket.in(user._id).emit("message recieved", newMessageRecieved);
        });
    });

    // WebRTC Call Signaling Events
    socket.on("call-user", (data) => {
        console.log(`📞 Call from ${data.from} to ${data.userToCall}`);
        io.to(data.userToCall).emit("call-user", {
            signal: data.signalData,
            from: data.from,
            callType: data.callType
        });
    });

    socket.on("accept-call", (data) => {
        console.log(`✅ Call accepted`);
        io.to(data.to).emit("call-accepted", data.signal);
    });

    socket.on("end-call", (data) => {
        console.log(`📴 Call ended`);
        io.to(data.to).emit("call-ended");
    });

    // Reaction Events
    socket.on("add-reaction", (data) => {
        const { chatId, message } = data;
        socket.in(chatId).emit("reaction-added", message);
    });

    socket.on("remove-reaction", (data) => {
        const { chatId, message } = data;
        socket.in(chatId).emit("reaction-removed", message);
    });

    socket.on("disconnect", () => {
        console.log("USER DISCONNECTED");
        // Update user status to offline
        if (socket.userId) {
            User.findByIdAndUpdate(socket.userId, {
                isOnline: false,
                lastSeen: new Date()
            }).then(() => {
                socket.broadcast.emit("user-offline", {
                    userId: socket.userId,
                    lastSeen: new Date()
                });
            });
        }
    });

    socket.on("off setup", (userData) => {
        console.log("USER DISCONNECTED");
        User.findByIdAndUpdate(userData._id, {
            isOnline: false,
            lastSeen: new Date()
        }).then(() => {
            socket.broadcast.emit("user-offline", {
                userId: userData._id,
                lastSeen: new Date()
            });
        });
        socket.leave(userData._id);
    });
});
