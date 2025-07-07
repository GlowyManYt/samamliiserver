"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCount = exports.markAsRead = exports.getConversations = exports.getConversation = exports.sendMessage = void 0;
const Message_1 = require("../models/Message");
const User_1 = require("../models/User");
const sendMessage = async (req, res) => {
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
        const recipient = await User_1.User.findById(recipientId);
        if (!recipient) {
            res.status(404).json({
                success: false,
                message: 'Recipient not found'
            });
            return;
        }
        const message = new Message_1.Message({
            sender: senderId,
            recipient: recipientId,
            content,
            messageType,
            attachments: attachments || []
        });
        await message.save();
        await message.populate('sender', 'name email profileImage');
        await message.populate('recipient', 'name email profileImage');
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};
exports.sendMessage = sendMessage;
const getConversation = async (req, res) => {
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
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const messages = await Message_1.Message.find({
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
        await Message_1.Message.updateMany({
            sender: otherUserId,
            recipient: currentUserId,
            isRead: false
        }, { isRead: true });
        res.status(200).json({
            success: true,
            message: 'Conversation retrieved successfully',
            data: messages.reverse(),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: await Message_1.Message.countDocuments({
                    $or: [
                        { sender: currentUserId, recipient: otherUserId },
                        { sender: otherUserId, recipient: currentUserId }
                    ]
                })
            }
        });
    }
    catch (error) {
        console.error('Error getting conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversation'
        });
    }
};
exports.getConversation = getConversation;
const getConversations = async (req, res) => {
    try {
        const currentUserId = req.user?._id;
        if (!currentUserId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const conversations = await Message_1.Message.getUserConversations(currentUserId);
        res.status(200).json({
            success: true,
            message: 'Conversations retrieved successfully',
            data: conversations
        });
    }
    catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get conversations'
        });
    }
};
exports.getConversations = getConversations;
const markAsRead = async (req, res) => {
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
        await Message_1.Message.updateMany({
            sender: senderId,
            recipient: currentUserId,
            isRead: false
        }, { isRead: true });
        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });
    }
    catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read'
        });
    }
};
exports.markAsRead = markAsRead;
const getUnreadCount = async (req, res) => {
    try {
        const currentUserId = req.user?._id;
        if (!currentUserId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const unreadCount = await Message_1.Message.countDocuments({
            recipient: currentUserId,
            isRead: false
        });
        res.status(200).json({
            success: true,
            message: 'Unread count retrieved successfully',
            data: { unreadCount }
        });
    }
    catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count'
        });
    }
};
exports.getUnreadCount = getUnreadCount;
//# sourceMappingURL=messageController.js.map