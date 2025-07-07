import mongoose, { Schema, Model } from 'mongoose';
import { INotification } from '../types';

const notificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required'],
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: {
      values: ['service_request', 'message', 'review', 'system'],
      message: 'Invalid notification type',
    },
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters'],
  },
  data: {
    type: Schema.Types.Mixed,
    required: false,
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
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ sender: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// Compound indexes
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });

// Static method to get notifications for a user
notificationSchema.statics.getForUser = function(userId: string, isRead?: boolean) {
  const query: any = { recipient: userId };
  
  if (typeof isRead === 'boolean') {
    query.isRead = isRead;
  }

  return this.find(query)
    .populate('sender', 'name profileImage')
    .sort({ createdAt: -1 });
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = function(userId: string, notificationIds?: string[]) {
  const query: any = { recipient: userId, isRead: false };
  
  if (notificationIds && notificationIds.length > 0) {
    query._id = { $in: notificationIds };
  }

  return this.updateMany(query, { $set: { isRead: true } });
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId: string) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

// Static method to create notification
notificationSchema.statics.createNotification = function(notificationData: {
  recipient: string;
  sender?: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}) {
  return this.create(notificationData);
};

// Static method to clean up old notifications
notificationSchema.statics.cleanupOldNotifications = function(olderThanDays: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true,
  });
};

export const Notification: Model<INotification> = mongoose.model<INotification>('Notification', notificationSchema);
