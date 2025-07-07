import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getUnreadCount
} from '../controllers/messageController';

const router = express.Router();

// All message routes require authentication
router.use(authenticate);

// Send a new message
router.post('/', sendMessage);

// Get all conversations for the current user
router.get('/conversations', getConversations);

// Get conversation with a specific user
router.get('/conversation/:otherUserId', getConversation);

// Mark messages as read
router.patch('/mark-read', markAsRead);

// Get unread message count
router.get('/unread-count', getUnreadCount);

export default router;
