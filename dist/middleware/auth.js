"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireResourceOwnership = exports.authRateLimit = exports.requireProvider = exports.requireVerified = exports.requireSelfOrAdmin = exports.requireAdmin = exports.authorize = exports.optionalAuth = exports.authenticate = void 0;
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("./errorHandler");
const environment_1 = require("../config/environment");
const authenticate = async (req, res, next) => {
    try {
        console.log('=== Authentication middleware called ===');
        console.log('Request URL:', req.url);
        console.log('Request method:', req.method);
        console.log('Authorization header:', req.headers.authorization);
        const token = jwt_1.JWTService.extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            throw (0, errorHandler_1.unauthorized)('Access token is required');
        }
        const decoded = jwt_1.JWTService.verifyAccessToken(token);
        const user = await models_1.User.findById(decoded.userId).select('+password');
        if (!user) {
            throw (0, errorHandler_1.unauthorized)('User not found');
        }
        if (!user.isActive) {
            throw (0, errorHandler_1.forbidden)('Account is deactivated');
        }
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const token = jwt_1.JWTService.extractTokenFromHeader(req.headers.authorization);
        if (token) {
            const decoded = jwt_1.JWTService.verifyAccessToken(token);
            const user = await models_1.User.findById(decoded.userId);
            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next((0, errorHandler_1.unauthorized)('Authentication required'));
        }
        if (!roles.includes(req.user.role)) {
            return next((0, errorHandler_1.forbidden)('Insufficient permissions'));
        }
        next();
    };
};
exports.authorize = authorize;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return next((0, errorHandler_1.unauthorized)('Authentication required'));
    }
    if (req.user.email !== environment_1.config.admin.email) {
        return next((0, errorHandler_1.forbidden)('Admin access required'));
    }
    next();
};
exports.requireAdmin = requireAdmin;
const requireSelfOrAdmin = (userIdParam = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return next((0, errorHandler_1.unauthorized)('Authentication required'));
        }
        const targetUserId = req.params[userIdParam];
        const isAdmin = req.user.email === environment_1.config.admin.email;
        const isSelf = req.user._id.toString() === targetUserId;
        if (!isAdmin && !isSelf) {
            return next((0, errorHandler_1.forbidden)('You can only access your own resources'));
        }
        next();
    };
};
exports.requireSelfOrAdmin = requireSelfOrAdmin;
const requireVerified = (req, res, next) => {
    if (!req.user) {
        return next((0, errorHandler_1.unauthorized)('Authentication required'));
    }
    if (!req.user.isVerified) {
        return next((0, errorHandler_1.forbidden)('Account verification required'));
    }
    next();
};
exports.requireVerified = requireVerified;
const requireProvider = (req, res, next) => {
    if (!req.user) {
        return next((0, errorHandler_1.unauthorized)('Authentication required'));
    }
    if (!['professional', 'expert'].includes(req.user.role)) {
        return next((0, errorHandler_1.forbidden)('Provider access required'));
    }
    next();
};
exports.requireProvider = requireProvider;
const authRateLimit = (maxRequests = 1000, windowMs = 3600000) => {
    const userRequests = new Map();
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        const userId = req.user._id.toString();
        const now = Date.now();
        const userLimit = userRequests.get(userId);
        if (!userLimit || now > userLimit.resetTime) {
            userRequests.set(userId, {
                count: 1,
                resetTime: now + windowMs,
            });
            return next();
        }
        if (userLimit.count >= maxRequests) {
            return next((0, errorHandler_1.forbidden)('Rate limit exceeded for authenticated user'));
        }
        userLimit.count++;
        next();
    };
};
exports.authRateLimit = authRateLimit;
const requireResourceOwnership = (resourceModel, resourceIdParam = 'id') => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return next((0, errorHandler_1.unauthorized)('Authentication required'));
            }
            const resourceId = req.params[resourceIdParam];
            const resource = await resourceModel.findById(resourceId);
            if (!resource) {
                return next(new Error('Resource not found'));
            }
            if (req.user.email === environment_1.config.admin.email) {
                return next();
            }
            const userId = req.user._id.toString();
            const isOwner = resource.user?.toString() === userId ||
                resource.owner?.toString() === userId ||
                resource.uploadedBy?.toString() === userId ||
                resource.client?.toString() === userId ||
                resource.provider?.toString() === userId;
            if (!isOwner) {
                return next((0, errorHandler_1.forbidden)('You do not have permission to access this resource'));
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireResourceOwnership = requireResourceOwnership;
//# sourceMappingURL=auth.js.map