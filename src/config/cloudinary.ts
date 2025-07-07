import { v2 as cloudinary } from 'cloudinary';
import { config } from './environment';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

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

class CloudinaryService {
  /**
   * Upload file to Cloudinary
   */
  async uploadFile(
    fileBuffer: Buffer,
    options: UploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      const defaultOptions: UploadOptions = {
        resource_type: 'auto',
        unique_filename: true,
        use_filename: true,
        overwrite: false,
        ...options,
      };

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          defaultOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve(result as CloudinaryUploadResult);
            } else {
              reject(new Error('Upload failed - no result returned'));
            }
          }
        ).end(fileBuffer);
      });
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error}`);
    }
  }

  /**
   * Upload profile image with optimization
   */
  async uploadProfileImage(fileBuffer: Buffer, userId: string): Promise<CloudinaryUploadResult> {
    return this.uploadFile(fileBuffer, {
      folder: 'same-mli-connect/profiles',
      public_id: `profile_${userId}`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      overwrite: true,
    });
  }

  /**
   * Upload document file
   */
  async uploadDocument(fileBuffer: Buffer, userId: string, documentType: string): Promise<CloudinaryUploadResult> {
    return this.uploadFile(fileBuffer, {
      folder: `same-mli-connect/documents/${userId}`,
      public_id: `${documentType}_${Date.now()}`,
      resource_type: 'auto',
    });
  }

  /**
   * Upload project attachment
   */
  async uploadProjectFile(fileBuffer: Buffer, serviceRequestId: string): Promise<CloudinaryUploadResult> {
    return this.uploadFile(fileBuffer, {
      folder: `same-mli-connect/projects/${serviceRequestId}`,
      public_id: `attachment_${Date.now()}`,
      resource_type: 'auto',
    });
  }

  /**
   * Upload message attachment
   */
  async uploadMessageAttachment(fileBuffer: Buffer, conversationId: string): Promise<CloudinaryUploadResult> {
    return this.uploadFile(fileBuffer, {
      folder: `same-mli-connect/messages/${conversationId}`,
      public_id: `message_${Date.now()}`,
      resource_type: 'auto',
    });
  }

  /**
   * Upload portfolio image for professionals/experts
   */
  async uploadPortfolioImage(fileBuffer: Buffer, userId: string, imageIndex: number): Promise<CloudinaryUploadResult> {
    return this.uploadFile(fileBuffer, {
      folder: `same-mli-connect/portfolio/${userId}`,
      public_id: `portfolio_${imageIndex}_${Date.now()}`,
      transformation: [
        { width: 800, height: 800, crop: 'fill', gravity: 'center' }, // Square aspect ratio
        { quality: 'auto', fetch_format: 'auto' }
      ],
      overwrite: false,
    });
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      throw new Error(`Failed to delete file from Cloudinary: ${error}`);
    }
  }

  /**
   * Get optimized image URL
   */
  getOptimizedImageUrl(publicId: string, options: any = {}): string {
    return cloudinary.url(publicId, {
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    });
  }

  /**
   * Generate thumbnail URL
   */
  getThumbnailUrl(publicId: string, width: number = 150, height: number = 150): string {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    });
  }
}

export const cloudinaryService = new CloudinaryService();
export { cloudinary };
