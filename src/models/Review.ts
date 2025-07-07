import mongoose, { Schema, Model } from 'mongoose';
import { IReview } from '../types';

const reviewSchema = new Schema<IReview>({
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer is required'],
  },
  reviewee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewee is required'],
  },
  serviceRequest: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: [true, 'Service request is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
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
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ serviceRequest: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });

// Compound indexes
reviewSchema.index({ reviewee: 1, rating: -1 });
reviewSchema.index({ reviewer: 1, createdAt: -1 });

// Unique constraint to prevent duplicate reviews for the same service request
reviewSchema.index({ reviewer: 1, serviceRequest: 1 }, { unique: true });

// Pre-save middleware to validate reviewer and reviewee are different
reviewSchema.pre('save', function(next) {
  if (this.reviewer.toString() === this.reviewee.toString()) {
    next(new Error('Reviewer and reviewee cannot be the same user'));
  } else {
    next();
  }
});

// Static method to get reviews for a user
reviewSchema.statics.getForUser = function(userId: string) {
  return this.find({ reviewee: userId })
    .populate('reviewer', 'name profileImage')
    .populate('serviceRequest', 'service')
    .sort({ createdAt: -1 });
};

// Static method to calculate average rating for a user
reviewSchema.statics.calculateAverageRating = async function(userId: string) {
  const result = await this.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0 
    ? { 
        averageRating: Math.round(result[0].averageRating * 10) / 10, 
        totalReviews: result[0].totalReviews 
      }
    : { averageRating: 0, totalReviews: 0 };
};

// Static method to get rating distribution for a user
reviewSchema.statics.getRatingDistribution = function(userId: string) {
  return this.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
  ]);
};

export const Review: Model<IReview> = mongoose.model<IReview>('Review', reviewSchema);
