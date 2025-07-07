import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: 'client' | 'professional' | 'expert';
  city?: string;
  specialty?: string;
  phone?: string;
  bio?: string;
  experience?: string;
  companyName?: string;
  documents?: string[];
  portfolioImages?: string[];
  profileImage?: string;
  rating?: number;
  coordinates?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  isVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Service Request Types
export interface IServiceRequest extends Document {
  _id: string;
  client: Types.ObjectId; // User ID
  provider: Types.ObjectId; // User ID
  service: string;
  description: string;
  attachments?: string[];
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  deadline?: Date;
  location?: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Message Types
export interface IMessage extends Document {
  _id: string;
  sender: Types.ObjectId; // User ID
  recipient: Types.ObjectId; // User ID
  serviceRequest?: Types.ObjectId; // Service Request ID
  content: string;
  attachments?: string[];
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Chat/Conversation Types
export interface IConversation extends Document {
  _id: string;
  participants: Types.ObjectId[]; // User IDs
  serviceRequest?: Types.ObjectId; // Service Request ID
  lastMessage?: Types.ObjectId; // Message ID
  lastActivity: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// File Upload Types
export interface IFile extends Document {
  _id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  uploadedBy: Types.ObjectId; // User ID
  category: 'profile' | 'document' | 'project' | 'message' | 'pdf_download';
  isPublic: boolean;
  createdAt: Date;
}

// Review/Rating Types
export interface IReview extends Document {
  _id: string;
  reviewer: Types.ObjectId; // User ID
  reviewee: Types.ObjectId; // User ID
  serviceRequest: Types.ObjectId; // Service Request ID
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface INotification extends Document {
  _id: string;
  recipient: Types.ObjectId; // User ID
  sender?: Types.ObjectId; // User ID
  type: 'service_request' | 'message' | 'review' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

// PDF Generation Types
export interface IPDFDocument {
  type: 'service_request' | 'user_profile' | 'conversation' | 'invoice' | 'report';
  title: string;
  data: any;
  template?: string;
  options?: {
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
  };
}

export interface IPDFGenerationRequest {
  documentType: IPDFDocument['type'];
  documentId: string;
  userId: Types.ObjectId;
  customData?: any;
  downloadToken?: string;
}

// Express Request with User
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query Parameters
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface UserSearchQuery extends PaginationQuery {
  role?: string;
  city?: string;
  specialty?: string;
  search?: string;
  rating?: string;
}

export interface ServiceRequestQuery extends PaginationQuery {
  status?: string;
  service?: string;
  client?: string;
  provider?: string;
}

// Socket.IO Types
export interface SocketUser {
  userId: string;
  socketId: string;
  isOnline: boolean;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
