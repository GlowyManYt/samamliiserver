import mongoose, { Schema, Model } from 'mongoose';
import { IFile } from '../types';

const fileSchema = new Schema<IFile>({
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true,
    maxlength: [255, 'Filename cannot exceed 255 characters'],
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true,
    unique: true,
  },
  mimetype: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true,
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative'],
    max: [10485760, 'File size cannot exceed 10MB'], // 10MB limit
  },
  cloudinaryUrl: {
    type: String,
    required: [true, 'Cloudinary URL is required'],
    trim: true,
  },
  cloudinaryPublicId: {
    type: String,
    required: [true, 'Cloudinary public ID is required'],
    trim: true,
    unique: true,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required'],
  },
  category: {
    type: String,
    required: [true, 'File category is required'],
    enum: {
      values: ['profile', 'document', 'project', 'message', 'pdf_download'],
      message: 'Invalid file category',
    },
  },
  isPublic: {
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
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ category: 1 });
fileSchema.index({ mimetype: 1 });
fileSchema.index({ createdAt: -1 });
// cloudinaryPublicId index is already created by unique: true

// Compound indexes
fileSchema.index({ uploadedBy: 1, category: 1 });
fileSchema.index({ category: 1, isPublic: 1 });

// Static method to get files by user
fileSchema.statics.getByUser = function(userId: string, category?: string) {
  const query: any = { uploadedBy: userId };
  
  if (category) {
    query.category = category;
  }

  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get public files
fileSchema.statics.getPublicFiles = function(category?: string) {
  const query: any = { isPublic: true };
  
  if (category) {
    query.category = category;
  }

  return this.find(query).sort({ createdAt: -1 });
};

// Instance method to check if user can access this file
fileSchema.methods.canAccess = function(userId: string): boolean {
  return this.isPublic || this.uploadedBy.toString() === userId;
};

// Instance method to get file URL with transformations
fileSchema.methods.getUrl = function(transformations?: string): string {
  if (transformations) {
    // Insert transformations into Cloudinary URL
    const urlParts = this.cloudinaryUrl.split('/upload/');
    return `${urlParts[0]}/upload/${transformations}/${urlParts[1]}`;
  }
  return this.cloudinaryUrl;
};

// Instance method to get thumbnail URL
fileSchema.methods.getThumbnailUrl = function(width: number = 150, height: number = 150): string {
  if (this.mimetype.startsWith('image/')) {
    return this.getUrl(`w_${width},h_${height},c_fill,q_auto,f_auto`);
  }
  return this.cloudinaryUrl;
};

// Static method to clean up orphaned files
fileSchema.statics.cleanupOrphanedFiles = function(olderThanDays: number = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  return this.find({
    createdAt: { $lt: cutoffDate },
    // Add conditions to identify orphaned files
    // This would depend on your specific business logic
  });
};

export const File: Model<IFile> = mongoose.model<IFile>('File', fileSchema);
