"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const notificationSchema = new mongoose_1.Schema({
    recipient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required'],
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.Mixed,
        required: false,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        },
    },
});
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ sender: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.statics.getForUser = function (userId, isRead) {
    const query = { recipient: userId };
    if (typeof isRead === 'boolean') {
        query.isRead = isRead;
    }
    return this.find(query)
        .populate('sender', 'name profileImage')
        .sort({ createdAt: -1 });
};
notificationSchema.statics.markAsRead = function (userId, notificationIds) {
    const query = { recipient: userId, isRead: false };
    if (notificationIds && notificationIds.length > 0) {
        query._id = { $in: notificationIds };
    }
    return this.updateMany(query, { $set: { isRead: true } });
};
notificationSchema.statics.getUnreadCount = function (userId) {
    return this.countDocuments({ recipient: userId, isRead: false });
};
notificationSchema.statics.createNotification = function (notificationData) {
    return this.create(notificationData);
};
notificationSchema.statics.cleanupOldNotifications = function (olderThanDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    return this.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true,
    });
};
exports.Notification = mongoose_1.default.model('Notification', notificationSchema);
//# sourceMappingURL=Notification.js.map