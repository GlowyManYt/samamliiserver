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
exports.ServiceRequest = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const budgetSchema = new mongoose_1.Schema({
    min: {
        type: Number,
        required: true,
        min: [0, 'Minimum budget cannot be negative'],
    },
    max: {
        type: Number,
        required: true,
        min: [0, 'Maximum budget cannot be negative'],
        validate: {
            validator: function (value) {
                return value >= this.min;
            },
            message: 'Maximum budget must be greater than or equal to minimum budget',
        },
    },
    currency: {
        type: String,
        required: true,
        enum: ['SAR', 'USD', 'EUR'],
        default: 'SAR',
    },
}, { _id: false });
const locationSchema = new mongoose_1.Schema({
    address: {
        type: String,
        required: true,
        trim: true,
        maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    coordinates: {
        lat: {
            type: Number,
            required: true,
            min: -90,
            max: 90,
        },
        lng: {
            type: Number,
            required: true,
            min: -180,
            max: 180,
        },
    },
}, { _id: false });
const serviceRequestSchema = new mongoose_1.Schema({
    client: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Client is required'],
    },
    provider: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Provider is required'],
    },
    service: {
        type: String,
        required: [true, 'Service type is required'],
        trim: true,
        enum: {
            values: [
                'تصميم داخلي',
                'هندسة معمارية',
                'نجارة وديكور',
                'كهرباء',
                'سباكة',
                'دهان وديكور',
                'تصميم جرافيك',
                'تطوير مواقع',
                'أخرى'
            ],
            message: 'Invalid service type',
        },
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    attachments: [{
            type: String,
            trim: true,
        }],
    status: {
        type: String,
        required: true,
        enum: {
            values: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
            message: 'Invalid status',
        },
        default: 'pending',
    },
    budget: {
        type: budgetSchema,
        required: false,
    },
    deadline: {
        type: Date,
        validate: {
            validator: function (value) {
                return !value || value > new Date();
            },
            message: 'Deadline must be in the future',
        },
    },
    location: {
        type: locationSchema,
        required: false,
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
serviceRequestSchema.index({ client: 1 });
serviceRequestSchema.index({ provider: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ service: 1 });
serviceRequestSchema.index({ createdAt: -1 });
serviceRequestSchema.index({ deadline: 1 });
serviceRequestSchema.index({ 'location.coordinates': '2dsphere' });
serviceRequestSchema.index({ client: 1, status: 1 });
serviceRequestSchema.index({ provider: 1, status: 1 });
serviceRequestSchema.index({ status: 1, createdAt: -1 });
serviceRequestSchema.pre('save', function (next) {
    if (this.client.toString() === this.provider.toString()) {
        next(new Error('Client and provider cannot be the same user'));
    }
    else {
        next();
    }
});
serviceRequestSchema.statics.getByUser = function (userId, role) {
    const query = role === 'client' ? { client: userId } : { provider: userId };
    return this.find(query)
        .populate('client', 'name email profileImage')
        .populate('provider', 'name email profileImage specialty rating')
        .sort({ createdAt: -1 });
};
serviceRequestSchema.statics.searchRequests = function (query) {
    const searchQuery = {};
    if (query.status && query.status !== 'all') {
        searchQuery.status = query.status;
    }
    if (query.service && query.service !== 'all') {
        searchQuery.service = query.service;
    }
    if (query.client) {
        searchQuery.client = query.client;
    }
    if (query.provider) {
        searchQuery.provider = query.provider;
    }
    if (query.search) {
        searchQuery.$or = [
            { service: new RegExp(query.search, 'i') },
            { description: new RegExp(query.search, 'i') },
        ];
    }
    return this.find(searchQuery)
        .populate('client', 'name email profileImage')
        .populate('provider', 'name email profileImage specialty rating')
        .sort({ createdAt: -1 });
};
serviceRequestSchema.methods.canModify = function (userId) {
    return this.client.toString() === userId || this.provider.toString() === userId;
};
serviceRequestSchema.methods.getNextValidStatuses = function () {
    switch (this.status) {
        case 'pending':
            return ['accepted', 'cancelled'];
        case 'accepted':
            return ['in_progress', 'cancelled'];
        case 'in_progress':
            return ['completed', 'cancelled'];
        case 'completed':
        case 'cancelled':
            return [];
        default:
            return [];
    }
};
exports.ServiceRequest = mongoose_1.default.model('ServiceRequest', serviceRequestSchema);
//# sourceMappingURL=ServiceRequest.js.map