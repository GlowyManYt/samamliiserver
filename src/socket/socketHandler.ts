import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { JWTPayload, SocketUser } from '../types';

// Store online users
const onlineUsers = new Map<string, SocketUser>();

export const initializeSocket = (io: SocketIOServer): void => {
  // Authentication middleware for socket connections
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      (socket as any).user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JWTPayload;
    
    console.log(`User ${user.email} connected with socket ID: ${socket.id}`);

    // Add user to online users
    onlineUsers.set(user.userId, {
      userId: user.userId,
      socketId: socket.id,
      isOnline: true,
    });

    // Join user to their personal room
    socket.join(`user_${user.userId}`);

    // Broadcast user online status
    socket.broadcast.emit('user_online', {
      userId: user.userId,
      isOnline: true,
    });

    // Handle joining conversation rooms
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${user.email} joined conversation: ${conversationId}`);
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${user.email} left conversation: ${conversationId}`);
    });

    // Handle sending messages
    socket.on('send_message', (data: {
      conversationId: string;
      recipientId: string;
      message: string;
      messageType: 'text' | 'image' | 'file';
      attachments?: string[];
    }) => {
      // Emit to conversation room
      socket.to(`conversation_${data.conversationId}`).emit('new_message', {
        senderId: user.userId,
        senderName: user.email, // You might want to include user name
        conversationId: data.conversationId,
        message: data.message,
        messageType: data.messageType,
        attachments: data.attachments,
        timestamp: new Date(),
      });

      // Emit to recipient's personal room for notifications
      socket.to(`user_${data.recipientId}`).emit('message_notification', {
        senderId: user.userId,
        senderName: user.email,
        conversationId: data.conversationId,
        message: data.message,
        timestamp: new Date(),
      });

      console.log(`Message sent from ${user.email} in conversation ${data.conversationId}`);
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { conversationId: string; recipientId: string }) => {
      socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
        userId: user.userId,
        conversationId: data.conversationId,
        isTyping: true,
      });
    });

    socket.on('typing_stop', (data: { conversationId: string; recipientId: string }) => {
      socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
        userId: user.userId,
        conversationId: data.conversationId,
        isTyping: false,
      });
    });

    // Handle message read status
    socket.on('mark_messages_read', (data: { conversationId: string; messageIds: string[] }) => {
      socket.to(`conversation_${data.conversationId}`).emit('messages_read', {
        conversationId: data.conversationId,
        messageIds: data.messageIds,
        readBy: user.userId,
        readAt: new Date(),
      });
    });

    // Handle service request notifications
    socket.on('service_request_update', (data: {
      recipientId: string;
      serviceRequestId: string;
      status: string;
      message: string;
    }) => {
      socket.to(`user_${data.recipientId}`).emit('service_request_notification', {
        senderId: user.userId,
        serviceRequestId: data.serviceRequestId,
        status: data.status,
        message: data.message,
        timestamp: new Date(),
      });
    });

    // Handle user location updates (for map discovery)
    socket.on('update_location', (data: { lat: number; lng: number }) => {
      // Broadcast location update to nearby users (you can implement proximity logic)
      socket.broadcast.emit('user_location_update', {
        userId: user.userId,
        coordinates: data,
        timestamp: new Date(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User ${user.email} disconnected: ${reason}`);

      // Remove user from online users
      onlineUsers.delete(user.userId);

      // Broadcast user offline status
      socket.broadcast.emit('user_offline', {
        userId: user.userId,
        isOnline: false,
        lastSeen: new Date(),
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${user.email}:`, error);
    });
  });

  // Handle server-side events
  io.engine.on('connection_error', (err) => {
    console.error('Socket.IO connection error:', err);
  });
};

// Helper functions to emit events from other parts of the application
export const getSocketIO = (): SocketIOServer | null => {
  // This will be set by the server instance
  return null; // TODO: Implement proper singleton pattern
};

export const emitToUser = (userId: string, event: string, data: any): void => {
  const io = getSocketIO();
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

export const emitToConversation = (conversationId: string, event: string, data: any): void => {
  const io = getSocketIO();
  if (io) {
    io.to(`conversation_${conversationId}`).emit(event, data);
  }
};

export const getOnlineUsers = (): Map<string, SocketUser> => {
  return onlineUsers;
};

export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId);
};
