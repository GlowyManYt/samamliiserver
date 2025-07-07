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
exports.Message = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const messageSchema = new mongoose_1.Schema({
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Sender is required'],
    },
    recipient: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required'],
    },
    serviceRequest: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        },
    },
});
messageSchema.index({ sender: 1 });
messageSchema.index({ recipient: 1 });
messageSchema.index({ serviceRequest: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.pre('save', function (next) {
    if (this.sender.toString() === this.recipient.toString()) {
        next(new Error('Sender and recipient cannot be the same user'));
    }
    else {
        next();
    }
});
messageSchema.statics.getConversation = function (user1Id, user2Id, serviceRequestId) {
    const query = {
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
messageSchema.statics.getUserConversations = function (userId) {
    return this.aggregate([
        {
            $match: {
                $or: [{ sender: new mongoose_1.default.Types.ObjectId(userId) }, { recipient: new mongoose_1.default.Types.ObjectId(userId) }],
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ['$sender', new mongoose_1.default.Types.ObjectId(userId)] },
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
                                    { $eq: ['$recipient', new mongoose_1.default.Types.ObjectId(userId)] },
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
messageSchema.statics.markAsRead = function (senderId, recipientId) {
    return this.updateMany({
        sender: senderId,
        recipient: recipientId,
        isRead: false,
    }, {
        $set: { isRead: true },
    });
};
messageSchema.statics.getUnreadCount = function (userId) {
    return this.countDocuments({
        recipient: userId,
        isRead: false,
    });
};
exports.Message = mongoose_1.default.model('Message', messageSchema);
//# sourceMappingURL=Message.js.map