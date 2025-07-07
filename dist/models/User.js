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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const environment_1 = require("../config/environment");
const coordinatesSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
    },
    coordinates: {
        type: [Number],
        required: true,
        validate: {
            validator: function (val) {
                return val.length === 2 &&
                    val[0] >= -180 && val[0] <= 180 &&
                    val[1] >= -90 && val[1] <= 90;
            },
            message: 'Coordinates must be [longitude, latitude] with valid ranges'
        }
    }
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: {
            values: ['client', 'professional', 'expert'],
            message: 'Role must be either client, professional, or expert',
        },
    },
    city: {
        type: String,
        trim: true,
        maxlength: [50, 'City cannot exceed 50 characters'],
    },
    specialty: {
        type: String,
        trim: true,
        maxlength: [100, 'Specialty cannot exceed 100 characters'],
        required: function () {
            return this.role === 'professional' || this.role === 'expert';
        },
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number'],
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    experience: {
        type: String,
        trim: true,
        maxlength: [50, 'Experience cannot exceed 50 characters'],
    },
    companyName: {
        type: String,
        trim: true,
        maxlength: [100, 'Company name cannot exceed 100 characters'],
        required: function () {
            return this.role === 'expert';
        },
    },
    documents: [{
            type: String,
            trim: true,
        }],
    portfolioImages: {
        type: [{
                type: String,
                trim: true,
            }],
        validate: {
            validator: function (val) {
                return val.length <= 6;
            },
            message: 'Cannot have more than 6 portfolio images'
        },
        default: []
    },
    profileImage: {
        type: String,
        trim: true,
    },
    rating: {
        type: Number,
        min: [0, 'Rating cannot be less than 0'],
        max: [5, 'Rating cannot be more than 5'],
        default: 0,
    },
    coordinates: {
        type: coordinatesSchema,
        required: false,
        index: '2dsphere'
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        },
    },
    toObject: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        },
    },
});
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ city: 1 });
userSchema.index({ specialty: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ isActive: 1, isVerified: 1 });
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const hashedPassword = await bcryptjs_1.default.hash(this.password, environment_1.config.security.bcryptRounds);
        this.password = hashedPassword;
        next();
    }
    catch (error) {
        next(error);
    }
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcryptjs_1.default.compare(candidatePassword, this.password);
    }
    catch (error) {
        throw new Error('Password comparison failed');
    }
};
userSchema.statics.findNearby = function (coordinates, maxDistance = 50000) {
    return this.find({
        coordinates: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [coordinates.lng, coordinates.lat],
                },
                $maxDistance: maxDistance,
            },
        },
        isActive: true,
        isVerified: true,
    });
};
userSchema.statics.searchUsers = function (query) {
    const searchQuery = { isActive: true };
    if (query.role && query.role !== 'all') {
        searchQuery.role = query.role;
    }
    if (query.city) {
        searchQuery.city = new RegExp(query.city, 'i');
    }
    if (query.specialty) {
        searchQuery.specialty = new RegExp(query.specialty, 'i');
    }
    if (query.search) {
        searchQuery.$or = [
            { name: new RegExp(query.search, 'i') },
            { specialty: new RegExp(query.search, 'i') },
            { bio: new RegExp(query.search, 'i') },
            { companyName: new RegExp(query.search, 'i') },
        ];
    }
    if (query.rating) {
        searchQuery.rating = { $gte: parseFloat(query.rating) };
    }
    return this.find(searchQuery);
};
exports.User = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map