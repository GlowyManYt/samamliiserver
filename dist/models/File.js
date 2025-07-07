"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const fileSchema = new mongoose_1.Schema({
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
        max: [10485760, 'File size cannot exceed 10MB'],
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Uploader is required'],
    },
    category: {
        type: String,
        required: [true, 'File category is required'],
        enum: {
            values: ['profile', 'document', 'project', 'message'],
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
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        },
    },
});
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ category: 1 });
fileSchema.index({ mimetype: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ cloudinaryPublicId: 1 });
fileSchema.index({ uploadedBy: 1, category: 1 });
fileSchema.index({ category: 1, isPublic: 1 });
fileSchema.statics.getByUser = function (userId, category) {
    const query = { uploadedBy: userId };
    if (category) {
        query.category = category;
    }
    return this.find(query).sort({ createdAt: -1 });
};
fileSchema.statics.getPublicFiles = function (category) {
    const query = { isPublic: true };
    if (category) {
        query.category = category;
    }
    return this.find(query).sort({ createdAt: -1 });
};
fileSchema.methods.canAccess = function (userId) {
    return this.isPublic || this.uploadedBy.toString() === userId;
};
fileSchema.methods.getUrl = function (transformations) {
    if (transformations) {
        const urlParts = this.cloudinaryUrl.split('/upload/');
        return `${urlParts[0]}/upload/${transformations}/${urlParts[1]}`;
    }
    return this.cloudinaryUrl;
};
fileSchema.methods.getThumbnailUrl = function (width = 150, height = 150) {
    if (this.mimetype.startsWith('image/')) {
        return this.getUrl(`w_${width},h_${height},c_fill,q_auto,f_auto`);
    }
    return this.cloudinaryUrl;
};
fileSchema.statics.cleanupOrphanedFiles = function (olderThanDays = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    return this.find({
        createdAt: { $lt: cutoffDate },
    });
};
exports.File = mongoose_1.default.model('File', fileSchema);
//# sourceMappingURL=File.js.map