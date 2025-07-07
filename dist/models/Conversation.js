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
exports.Conversation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const conversationSchema = new mongoose_1.Schema({
    participants: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],
    serviceRequest: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ServiceRequest',
        required: false,
    },
    lastMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
        required: false,
    },
    lastActivity: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
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
conversationSchema.index({ participants: 1 });
conversationSchema.index({ serviceRequest: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ isActive: 1 });
conversationSchema.index({ participants: 1, isActive: 1 });
conversationSchema.pre('save', function (next) {
    if (this.participants.length !== 2) {
        next(new Error('Conversation must have exactly 2 participants'));
    }
    else if (this.participants[0].toString() === this.participants[1].toString()) {
        next(new Error('Participants must be different users'));
    }
    else {
        next();
    }
});
conversationSchema.statics.findOrCreate = async function (participant1Id, participant2Id, serviceRequestId) {
    const query = {
        participants: { $all: [participant1Id, participant2Id] },
        isActive: true,
    };
    if (serviceRequestId) {
        query.serviceRequest = serviceRequestId;
    }
    let conversation = await this.findOne(query)
        .populate('participants', 'name profileImage specialty')
        .populate('serviceRequest', 'service status')
        .populate('lastMessage');
    if (!conversation) {
        conversation = await this.create({
            participants: [participant1Id, participant2Id],
            serviceRequest: serviceRequestId,
            lastActivity: new Date(),
        });
        conversation = await this.findById(conversation._id)
            .populate('participants', 'name profileImage specialty')
            .populate('serviceRequest', 'service status')
            .populate('lastMessage');
    }
    return conversation;
};
conversationSchema.statics.getUserConversations = function (userId) {
    return this.find({
        participants: userId,
        isActive: true,
    })
        .populate('participants', 'name profileImage specialty')
        .populate('serviceRequest', 'service status')
        .populate('lastMessage')
        .sort({ lastActivity: -1 });
};
conversationSchema.methods.updateActivity = function () {
    this.lastActivity = new Date();
    return this.save();
};
conversationSchema.methods.isParticipant = function (userId) {
    return this.participants.some((participant) => participant._id ? participant._id.toString() === userId : participant.toString() === userId);
};
conversationSchema.methods.getOtherParticipant = function (userId) {
    return this.participants.find((participant) => {
        const participantId = participant._id ? participant._id.toString() : participant.toString();
        return participantId !== userId;
    });
};
exports.Conversation = mongoose_1.default.model('Conversation', conversationSchema);
//# sourceMappingURL=Conversation.js.map