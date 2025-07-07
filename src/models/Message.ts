import mongoose, { Schema, Model } from 'mongoose';
import { IMessage } from '../types';

const messageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required'],
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required'],
  },
  serviceRequest: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: false,
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
  },
  attachments: [{
    type: String,
    trim: true,
  }],
  messageType: {
    type: String,
    required: true,
    enum: {
      values: ['text', 'image', 'file'],
      message: 'Invalid message type',
    },
    default: 'text',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for better query performance
messageSchema.index({ sender: 1 });
messageSchema.index({ recipient: 1 });
messageSchema.index({ serviceRequest: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ isRead: 1 });

// Compound indexes for conversation queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });

// Pre-save middleware to validate sender and recipient are different
messageSchema.pre('save', function(next) {
  if (this.sender.toString() === this.recipient.toString()) {
    next(new Error('Sender and recipient cannot be the same user'));
  } else {
    next();
  }
});

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(
  user1Id: string,
  user2Id: string,
  serviceRequestId?: string
) {
  const query: any = {
    $or: [
      { sender: user1Id, recipient: user2Id },
      { sender: user2Id, recipient: user1Id },
    ],
  };

  if (serviceRequestId) {
    query.serviceRequest = serviceRequestId;
  }

  return this.find(query)
    .populate('sender', 'name profileImage')
    .populate('recipient', 'name profileImage')
    .sort({ createdAt: 1 });
};

// Static method to get user's conversations
messageSchema.statics.getUserConversations = function(userId: string) {
  return this.aggregate([
    {
      $match: {
        $or: [{ sender: new mongoose.Types.ObjectId(userId) }, { recipient: new mongoose.Types.ObjectId(userId) }],
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', new mongoose.Types.ObjectId(userId)] },
            '$recipient',
            '$sender',
          ],
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipient', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$isRead', false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUser',
      },
    },
    {
      $unwind: '$otherUser',
    },
    {
      $project: {
        _id: 1,
        lastMessage: 1,
        unreadCount: 1,
        otherUser: {
          _id: 1,
          name: 1,
          profileImage: 1,
          specialty: 1,
        },
      },
    },
    {
      $sort: { 'lastMessage.createdAt': -1 },
    },
  ]);
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(senderId: string, recipientId: string) {
  return this.updateMany(
    {
      sender: senderId,
      recipient: recipientId,
      isRead: false,
    },
    {
      $set: { isRead: true },
    }
  );
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);
