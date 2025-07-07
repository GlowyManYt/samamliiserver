import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const sendMessage: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getConversation: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getConversations: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const markAsRead: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUnreadCount: (req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=messageController.d.ts.map