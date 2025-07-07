import { Request } from 'express';
import { Document, Types } from 'mongoose';
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
        coordinates: [number, number];
    };
    isVerified: boolean;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export interface IServiceRequest extends Document {
    _id: string;
    client: Types.ObjectId;
    provider: Types.ObjectId;
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
export interface IMessage extends Document {
    _id: string;
    sender: Types.ObjectId;
    recipient: Types.ObjectId;
    serviceRequest?: Types.ObjectId;
    content: string;
    attachments?: string[];
    messageType: 'text' | 'image' | 'file';
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IConversation extends Document {
    _id: string;
    participants: Types.ObjectId[];
    serviceRequest?: Types.ObjectId;
    lastMessage?: Types.ObjectId;
    lastActivity: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface IFile extends Document {
    _id: string;
    originalName: string;
    filename: string;
    mimetype: string;
    size: number;
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    uploadedBy: Types.ObjectId;
    category: 'profile' | 'document' | 'project' | 'message' | 'pdf_download';
    isPublic: boolean;
    createdAt: Date;
}
export interface IReview extends Document {
    _id: string;
    reviewer: Types.ObjectId;
    reviewee: Types.ObjectId;
    serviceRequest: Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface INotification extends Document {
    _id: string;
    recipient: Types.ObjectId;
    sender?: Types.ObjectId;
    type: 'service_request' | 'message' | 'review' | 'system';
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: Date;
}
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
export interface AuthenticatedRequest extends Request {
    user?: IUser;
}
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
export interface SocketUser {
    userId: string;
    socketId: string;
    isOnline: boolean;
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=index.d.ts.map