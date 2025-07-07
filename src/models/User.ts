import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';
import { config } from '../config/environment';

const coordinatesSchema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(val: number[]) {
        return val.length === 2 &&
               val[0] >= -180 && val[0] <= 180 && // longitude
               val[1] >= -90 && val[1] <= 90;     // latitude
      },
      message: 'Coordinates must be [longitude, latitude] with valid ranges'
    }
  }
}, { _id: false });

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't include password in queries by default
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['client', 'professional', 'expert'],
      message: 'Role must be either client, professional, or expert',
    },
  },
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City cannot exceed 50 characters'],
  },
  specialty: {
    type: String,
    trim: true,
    maxlength: [100, 'Specialty cannot exceed 100 characters'],
    required: function(this: IUser) {
      return this.role === 'professional' || this.role === 'expert';
    },
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  experience: {
    type: String,
    trim: true,
    maxlength: [50, 'Experience cannot exceed 50 characters'],
  },
  companyName: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters'],
    required: function(this: IUser) {
      return this.role === 'expert';
    },
  },
  documents: [{
    type: String,
    trim: true,
  }],
  portfolioImages: {
    type: [{
      type: String,
      trim: true,
    }],
    validate: {
      validator: function(val: string[]) {
        return val.length <= 6;
      },
      message: 'Cannot have more than 6 portfolio images'
    },
    default: []
  },
  profileImage: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0,
  },
  coordinates: {
    type: coordinatesSchema,
    required: false,
    index: '2dsphere'
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ city: 1 });
userSchema.index({ specialty: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ isActive: 1, isVerified: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, config.security.bcryptRounds);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Static method to find users by location
userSchema.statics.findNearby = function(
  coordinates: { lat: number; lng: number },
  maxDistance: number = 50000 // 50km in meters
) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat],
        },
        $maxDistance: maxDistance,
      },
    },
    isActive: true,
    isVerified: true,
  });
};

// Static method to search users
userSchema.statics.searchUsers = function(query: any) {
  const searchQuery: any = { isActive: true };

  if (query.role && query.role !== 'all') {
    searchQuery.role = query.role;
  }

  if (query.city) {
    searchQuery.city = new RegExp(query.city, 'i');
  }

  if (query.specialty) {
    searchQuery.specialty = new RegExp(query.specialty, 'i');
  }

  if (query.search) {
    searchQuery.$or = [
      { name: new RegExp(query.search, 'i') },
      { specialty: new RegExp(query.search, 'i') },
      { bio: new RegExp(query.search, 'i') },
      { companyName: new RegExp(query.search, 'i') },
    ];
  }

  if (query.rating) {
    searchQuery.rating = { $gte: parseFloat(query.rating) };
  }

  return this.find(searchQuery);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
