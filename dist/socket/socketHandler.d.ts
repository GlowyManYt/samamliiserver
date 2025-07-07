import { Server as SocketIOServer } from 'socket.io';
import { SocketUser } from '../types';
export declare const initializeSocket: (io: SocketIOServer) => void;
export declare const getSocketIO: () => SocketIOServer | null;
export declare const emitToUser: (userId: string, event: string, data: any) => void;
export declare const emitToConversation: (conversationId: string, event: string, data: any) => void;
export declare const getOnlineUsers: () => Map<string, SocketUser>;
export declare const isUserOnline: (userId: string) => boolean;
//# sourceMappingURL=socketHandler.d.ts.map