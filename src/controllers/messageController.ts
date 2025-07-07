import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';

// Send a new message
export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { recipientId, content, messageType = 'text', attachments } = req.body;
    const senderId = req.user?._id;

    if (!senderId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
      return;
    }

    // Create message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content,
      messageType,
      attachments: attachments || []
    });

    await message.save();

    // Populate sender and recipient info
    await message.populate('sender', 'name email profileImage');
    await message.populate('recipient', 'name email profileImage');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Get conversation between two users
export const getConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { otherUserId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    })
    .populate('sender', 'name email profileImage')
    .populate('recipient', 'name email profileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

    // Mark messages from other user as read
    await Message.updateMany(
      {
        sender: otherUserId,
        recipient: currentUserId,
        isRead: false
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation retrieved successfully',
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: await Message.countDocuments({
          $or: [
            { sender: currentUserId, recipient: otherUserId },
            { sender: otherUserId, recipient: currentUserId }
          ]
        })
      }
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation'
    });
  }
};

// Get all conversations for a user
export const getConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Use the static method from Message model
    const conversations = await (Message as any).getUserConversations(currentUserId);

    res.status(200).json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: conversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
};

// Mark messages as read
export const markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { senderId } = req.body;
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    await Message.updateMany(
      {
        sender: senderId,
        recipient: currentUserId,
        isRead: false
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user?._id;

    if (!currentUserId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const unreadCount = await Message.countDocuments({
      recipient: currentUserId,
      isRead: false
    });

    res.status(200).json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};
