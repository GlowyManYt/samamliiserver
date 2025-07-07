"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.cloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const environment_1 = require("./environment");
cloudinary_1.v2.config({
    cloud_name: environment_1.config.cloudinary.cloudName,
    api_key: environment_1.config.cloudinary.apiKey,
    api_secret: environment_1.config.cloudinary.apiSecret,
});
class CloudinaryService {
    async uploadFile(fileBuffer, options = {}) {
        try {
            const defaultOptions = {
                resource_type: 'auto',
                unique_filename: true,
                use_filename: true,
                overwrite: false,
                ...options,
            };
            return new Promise((resolve, reject) => {
                cloudinary_1.v2.uploader.upload_stream(defaultOptions, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else if (result) {
                        resolve(result);
                    }
                    else {
                        reject(new Error('Upload failed - no result returned'));
                    }
                }).end(fileBuffer);
            });
        }
        catch (error) {
            throw new Error(`Cloudinary upload failed: ${error}`);
        }
    }
    async uploadProfileImage(fileBuffer, userId) {
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
    async uploadDocument(fileBuffer, userId, documentType) {
        return this.uploadFile(fileBuffer, {
            folder: `same-mli-connect/documents/${userId}`,
            public_id: `${documentType}_${Date.now()}`,
            resource_type: 'auto',
        });
    }
    async uploadProjectFile(fileBuffer, serviceRequestId) {
        return this.uploadFile(fileBuffer, {
            folder: `same-mli-connect/projects/${serviceRequestId}`,
            public_id: `attachment_${Date.now()}`,
            resource_type: 'auto',
        });
    }
    async uploadMessageAttachment(fileBuffer, conversationId) {
        return this.uploadFile(fileBuffer, {
            folder: `same-mli-connect/messages/${conversationId}`,
            public_id: `message_${Date.now()}`,
            resource_type: 'auto',
        });
    }
    async uploadPortfolioImage(fileBuffer, userId, imageIndex) {
        return this.uploadFile(fileBuffer, {
            folder: `same-mli-connect/portfolio/${userId}`,
            public_id: `portfolio_${imageIndex}_${Date.now()}`,
            transformation: [
                { width: 800, height: 800, crop: 'fill', gravity: 'center' },
                { quality: 'auto', fetch_format: 'auto' }
            ],
            overwrite: false,
        });
    }
    async deleteFile(publicId, resourceType = 'image') {
        try {
            await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
        }
        catch (error) {
            throw new Error(`Failed to delete file from Cloudinary: ${error}`);
        }
    }
    getOptimizedImageUrl(publicId, options = {}) {
        return cloudinary_1.v2.url(publicId, {
            quality: 'auto',
            fetch_format: 'auto',
            ...options,
        });
    }
    getThumbnailUrl(publicId, width = 150, height = 150) {
        return cloudinary_1.v2.url(publicId, {
            width,
            height,
            crop: 'fill',
            quality: 'auto',
            fetch_format: 'auto',
        });
    }
}
exports.cloudinaryService = new CloudinaryService();
//# sourceMappingURL=cloudinary.js.map