"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserOnline = exports.getOnlineUsers = exports.emitToConversation = exports.emitToUser = exports.getSocketIO = exports.initializeSocket = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
const onlineUsers = new Map();
const initializeSocket = (io) => {
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
            socket.user = decoded;
            next();
        }
        catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`User ${user.email} connected with socket ID: ${socket.id}`);
        onlineUsers.set(user.userId, {
            userId: user.userId,
            socketId: socket.id,
            isOnline: true,
        });
        socket.join(`user_${user.userId}`);
        socket.broadcast.emit('user_online', {
            userId: user.userId,
            isOnline: true,
        });
        socket.on('join_conversation', (conversationId) => {
            socket.join(`conversation_${conversationId}`);
            console.log(`User ${user.email} joined conversation: ${conversationId}`);
        });
        socket.on('leave_conversation', (conversationId) => {
            socket.leave(`conversation_${conversationId}`);
            console.log(`User ${user.email} left conversation: ${conversationId}`);
        });
        socket.on('send_message', (data) => {
            socket.to(`conversation_${data.conversationId}`).emit('new_message', {
                senderId: user.userId,
                senderName: user.email,
                conversationId: data.conversationId,
                message: data.message,
                messageType: data.messageType,
                attachments: data.attachments,
                timestamp: new Date(),
            });
            socket.to(`user_${data.recipientId}`).emit('message_notification', {
                senderId: user.userId,
                senderName: user.email,
                conversationId: data.conversationId,
                message: data.message,
                timestamp: new Date(),
            });
            console.log(`Message sent from ${user.email} in conversation ${data.conversationId}`);
        });
        socket.on('typing_start', (data) => {
            socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
                userId: user.userId,
                conversationId: data.conversationId,
                isTyping: true,
            });
        });
        socket.on('typing_stop', (data) => {
            socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
                userId: user.userId,
                conversationId: data.conversationId,
                isTyping: false,
            });
        });
        socket.on('mark_messages_read', (data) => {
            socket.to(`conversation_${data.conversationId}`).emit('messages_read', {
                conversationId: data.conversationId,
                messageIds: data.messageIds,
                readBy: user.userId,
                readAt: new Date(),
            });
        });
        socket.on('service_request_update', (data) => {
            socket.to(`user_${data.recipientId}`).emit('service_request_notification', {
                senderId: user.userId,
                serviceRequestId: data.serviceRequestId,
                status: data.status,
                message: data.message,
                timestamp: new Date(),
            });
        });
        socket.on('update_location', (data) => {
            socket.broadcast.emit('user_location_update', {
                userId: user.userId,
                coordinates: data,
                timestamp: new Date(),
            });
        });
        socket.on('disconnect', (reason) => {
            console.log(`User ${user.email} disconnected: ${reason}`);
            onlineUsers.delete(user.userId);
            socket.broadcast.emit('user_offline', {
                userId: user.userId,
                isOnline: false,
                lastSeen: new Date(),
            });
        });
        socket.on('error', (error) => {
            console.error(`Socket error for user ${user.email}:`, error);
        });
    });
    io.engine.on('connection_error', (err) => {
        console.error('Socket.IO connection error:', err);
    });
};
exports.initializeSocket = initializeSocket;
const getSocketIO = () => {
    return null;
};
exports.getSocketIO = getSocketIO;
const emitToUser = (userId, event, data) => {
    const io = (0, exports.getSocketIO)();
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};
exports.emitToUser = emitToUser;
const emitToConversation = (conversationId, event, data) => {
    const io = (0, exports.getSocketIO)();
    if (io) {
        io.to(`conversation_${conversationId}`).emit(event, data);
    }
};
exports.emitToConversation = emitToConversation;
const getOnlineUsers = () => {
    return onlineUsers;
};
exports.getOnlineUsers = getOnlineUsers;
const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
};
exports.isUserOnline = isUserOnline;
//# sourceMappingURL=socketHandler.js.map