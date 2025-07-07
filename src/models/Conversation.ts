import mongoose, { Schema, Model } from 'mongoose';
import { IConversation } from '../types';

const conversationSchema = new Schema<IConversation>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  serviceRequest: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: false,
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
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
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ serviceRequest: 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ isActive: 1 });

// Compound index for finding conversations by participants
conversationSchema.index({ participants: 1, isActive: 1 });

// Pre-save middleware to validate participants
conversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    next(new Error('Conversation must have exactly 2 participants'));
  } else if (this.participants[0].toString() === this.participants[1].toString()) {
    next(new Error('Participants must be different users'));
  } else {
    next();
  }
});

// Static method to find or create conversation
conversationSchema.statics.findOrCreate = async function(
  participant1Id: string,
  participant2Id: string,
  serviceRequestId?: string
) {
  const query: any = {
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

// Static method to get user's conversations
conversationSchema.statics.getUserConversations = function(userId: string) {
  return this.find({
    participants: userId,
    isActive: true,
  })
    .populate('participants', 'name profileImage specialty')
    .populate('serviceRequest', 'service status')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });
};

// Instance method to update last activity
conversationSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Instance method to check if user is participant
conversationSchema.methods.isParticipant = function(userId: string): boolean {
  return this.participants.some((participant: any) => 
    participant._id ? participant._id.toString() === userId : participant.toString() === userId
  );
};

// Instance method to get other participant
conversationSchema.methods.getOtherParticipant = function(userId: string) {
  return this.participants.find((participant: any) => {
    const participantId = participant._id ? participant._id.toString() : participant.toString();
    return participantId !== userId;
  });
};

export const Conversation: Model<IConversation> = mongoose.model<IConversation>('Conversation', conversationSchema);
