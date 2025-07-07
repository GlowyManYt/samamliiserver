import { v2 as cloudinary } from 'cloudinary';
export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
}
export interface UploadOptions {
    folder?: string;
    transformation?: any[];
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    public_id?: string;
    overwrite?: boolean;
    unique_filename?: boolean;
    use_filename?: boolean;
}
declare class CloudinaryService {
    uploadFile(fileBuffer: Buffer, options?: UploadOptions): Promise<CloudinaryUploadResult>;
    uploadProfileImage(fileBuffer: Buffer, userId: string): Promise<CloudinaryUploadResult>;
    uploadDocument(fileBuffer: Buffer, userId: string, documentType: string): Promise<CloudinaryUploadResult>;
    uploadProjectFile(fileBuffer: Buffer, serviceRequestId: string): Promise<CloudinaryUploadResult>;
    uploadMessageAttachment(fileBuffer: Buffer, conversationId: string): Promise<CloudinaryUploadResult>;
    uploadPortfolioImage(fileBuffer: Buffer, userId: string, imageIndex: number): Promise<CloudinaryUploadResult>;
    deleteFile(publicId: string, resourceType?: 'image' | 'video' | 'raw'): Promise<void>;
    getOptimizedImageUrl(publicId: string, options?: any): string;
    getThumbnailUrl(publicId: string, width?: number, height?: number): string;
}
export declare const cloudinaryService: CloudinaryService;
export { cloudinary };
//# sourceMappingURL=cloudinary.d.ts.map