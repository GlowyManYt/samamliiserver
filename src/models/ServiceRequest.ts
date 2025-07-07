import mongoose, { Schema, Model } from 'mongoose';
import { IServiceRequest } from '../types';

const budgetSchema = new Schema({
  min: {
    type: Number,
    required: true,
    min: [0, 'Minimum budget cannot be negative'],
  },
  max: {
    type: Number,
    required: true,
    min: [0, 'Maximum budget cannot be negative'],
    validate: {
      validator: function(this: any, value: number) {
        return value >= this.min;
      },
      message: 'Maximum budget must be greater than or equal to minimum budget',
    },
  },
  currency: {
    type: String,
    required: true,
    enum: ['SAR', 'USD', 'EUR'],
    default: 'SAR',
  },
}, { _id: false });

const locationSchema = new Schema({
  address: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters'],
  },
  coordinates: {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },
  },
}, { _id: false });

const serviceRequestSchema = new Schema<IServiceRequest>({
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client is required'],
  },
  provider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Provider is required'],
  },
  service: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true,
    enum: {
      values: [
        'تصميم داخلي',
        'هندسة معمارية',
        'نجارة وديكور',
        'كهرباء',
        'سباكة',
        'دهان وديكور',
        'تصميم جرافيك',
        'تطوير مواقع',
        'أخرى'
      ],
      message: 'Invalid service type',
    },
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  attachments: [{
    type: String,
    trim: true,
  }],
  status: {
    type: String,
    required: true,
    enum: {
      values: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      message: 'Invalid status',
    },
    default: 'pending',
  },
  budget: {
    type: budgetSchema,
    required: false,
  },
  deadline: {
    type: Date,
    validate: {
      validator: function(value: Date) {
        return !value || value > new Date();
      },
      message: 'Deadline must be in the future',
    },
  },
  location: {
    type: locationSchema,
    required: false,
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
serviceRequestSchema.index({ client: 1 });
serviceRequestSchema.index({ provider: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ service: 1 });
serviceRequestSchema.index({ createdAt: -1 });
serviceRequestSchema.index({ deadline: 1 });
serviceRequestSchema.index({ 'location.coordinates': '2dsphere' });

// Compound indexes
serviceRequestSchema.index({ client: 1, status: 1 });
serviceRequestSchema.index({ provider: 1, status: 1 });
serviceRequestSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to validate client and provider are different
serviceRequestSchema.pre('save', function(next) {
  if (this.client.toString() === this.provider.toString()) {
    next(new Error('Client and provider cannot be the same user'));
  } else {
    next();
  }
});

// Static method to get service requests by user
serviceRequestSchema.statics.getByUser = function(userId: string, role: 'client' | 'provider') {
  const query = role === 'client' ? { client: userId } : { provider: userId };
  return this.find(query)
    .populate('client', 'name email profileImage')
    .populate('provider', 'name email profileImage specialty rating')
    .sort({ createdAt: -1 });
};

// Static method to search service requests
serviceRequestSchema.statics.searchRequests = function(query: any) {
  const searchQuery: any = {};

  if (query.status && query.status !== 'all') {
    searchQuery.status = query.status;
  }

  if (query.service && query.service !== 'all') {
    searchQuery.service = query.service;
  }

  if (query.client) {
    searchQuery.client = query.client;
  }

  if (query.provider) {
    searchQuery.provider = query.provider;
  }

  if (query.search) {
    searchQuery.$or = [
      { service: new RegExp(query.search, 'i') },
      { description: new RegExp(query.search, 'i') },
    ];
  }

  return this.find(searchQuery)
    .populate('client', 'name email profileImage')
    .populate('provider', 'name email profileImage specialty rating')
    .sort({ createdAt: -1 });
};

// Instance method to check if user can modify this request
serviceRequestSchema.methods.canModify = function(userId: string): boolean {
  return this.client.toString() === userId || this.provider.toString() === userId;
};

// Instance method to get next valid statuses
serviceRequestSchema.methods.getNextValidStatuses = function(): string[] {
  switch (this.status) {
    case 'pending':
      return ['accepted', 'cancelled'];
    case 'accepted':
      return ['in_progress', 'cancelled'];
    case 'in_progress':
      return ['completed', 'cancelled'];
    case 'completed':
    case 'cancelled':
      return [];
    default:
      return [];
  }
};

export const ServiceRequest: Model<IServiceRequest> = mongoose.model<IServiceRequest>('ServiceRequest', serviceRequestSchema);
