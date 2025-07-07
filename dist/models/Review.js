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
exports.Review = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const reviewSchema = new mongoose_1.Schema({
    reviewer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reviewer is required'],
    },
    reviewee: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reviewee is required'],
    },
    serviceRequest: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        transform: function (doc, ret) {
            delete ret.__v;
            return ret;
        },
    },
});
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ serviceRequest: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ reviewee: 1, rating: -1 });
reviewSchema.index({ reviewer: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, serviceRequest: 1 }, { unique: true });
reviewSchema.pre('save', function (next) {
    if (this.reviewer.toString() === this.reviewee.toString()) {
        next(new Error('Reviewer and reviewee cannot be the same user'));
    }
    else {
        next();
    }
});
reviewSchema.statics.getForUser = function (userId) {
    return this.find({ reviewee: userId })
        .populate('reviewer', 'name profileImage')
        .populate('serviceRequest', 'service')
        .sort({ createdAt: -1 });
};
reviewSchema.statics.calculateAverageRating = async function (userId) {
    const result = await this.aggregate([
        { $match: { reviewee: new mongoose_1.default.Types.ObjectId(userId) } },
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
reviewSchema.statics.getRatingDistribution = function (userId) {
    return this.aggregate([
        { $match: { reviewee: new mongoose_1.default.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$rating',
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: -1 } },
    ]);
};
exports.Review = mongoose_1.default.model('Review', reviewSchema);
//# sourceMappingURL=Review.js.map