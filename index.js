import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());
app.use(cors());

import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import messageRoutes from './routes/message.routes.js';

app.use('/api/user', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);

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

    socket.on("off setup", () => {
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});
