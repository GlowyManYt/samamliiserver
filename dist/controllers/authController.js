"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.deactivateAccount = exports.logout = exports.changePassword = exports.updateProfile = exports.getProfile = exports.refreshToken = exports.login = exports.register = void 0;
const express_validator_1 = require("express-validator");
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const errorHandler_1 = require("../middleware/errorHandler");
const cloudinary_1 = require("../config/cloudinary");
exports.register = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.badRequest)('Validation failed', errors.array());
    }
    const { email, password, name, role, phone, city, specialty, companyName, bio, experience, coordinates, portfolioImages } = req.body;
    const existingUser = await models_1.User.findOne({ email });
    if (existingUser) {
        throw (0, errorHandler_1.conflict)('User with this email already exists');
    }
    let geoCoordinates;
    if (coordinates && coordinates.lat && coordinates.lng) {
        geoCoordinates = {
            type: 'Point',
            coordinates: [coordinates.lng, coordinates.lat]
        };
    }
    const user = await models_1.User.create({
        email,
        password,
        name,
        role,
        phone,
        city,
        specialty,
        companyName,
        bio,
        experience,
        coordinates: geoCoordinates,
        portfolioImages: [],
    });
    let uploadedPortfolioImages = [];
    if (portfolioImages && Array.isArray(portfolioImages) && portfolioImages.length > 0) {
        console.log(`Uploading ${portfolioImages.length} portfolio images to Cloudinary for user ${user._id}...`);
        for (let i = 0; i < portfolioImages.length; i++) {
            const imageData = portfolioImages[i];
            if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
                try {
                    const base64Data = imageData.split(',')[1];
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    const uploadResult = await cloudinary_1.cloudinaryService.uploadPortfolioImage(imageBuffer, user._id.toString(), i);
                    uploadedPortfolioImages.push(uploadResult.secure_url);
                    console.log(`Portfolio image ${i + 1} uploaded successfully: ${uploadResult.secure_url}`);
                }
                catch (error) {
                    console.error(`Error uploading portfolio image ${i + 1}:`, error);
                }
            }
            else {
                uploadedPortfolioImages.push(imageData);
            }
        }
        if (uploadedPortfolioImages.length > 0) {
            user.portfolioImages = uploadedPortfolioImages;
            await user.save();
            console.log(`Updated user ${user._id} with ${uploadedPortfolioImages.length} portfolio images`);
        }
    }
    const tokens = jwt_1.JWTService.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
    });
    user.lastLogin = new Date();
    await user.save();
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isVerified: user.isVerified,
                isActive: user.isActive,
            },
            tokens,
        },
    });
});
exports.login = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.badRequest)('Validation failed', errors.array());
    }
    const { email, password } = req.body;
    const user = await models_1.User.findOne({ email }).select('+password');
    if (!user) {
        throw (0, errorHandler_1.unauthorized)('Invalid email or password');
    }
    if (!user.isActive) {
        throw (0, errorHandler_1.unauthorized)('Account is deactivated');
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw (0, errorHandler_1.unauthorized)('Invalid email or password');
    }
    const tokens = jwt_1.JWTService.generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
    });
    user.lastLogin = new Date();
    await user.save();
    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isVerified: user.isVerified,
                isActive: user.isActive,
                profileImage: user.profileImage,
                specialty: user.specialty,
                city: user.city,
                rating: user.rating,
            },
            tokens,
        },
    });
});
exports.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw (0, errorHandler_1.badRequest)('Refresh token is required');
    }
    try {
        const decoded = jwt_1.JWTService.verifyRefreshToken(refreshToken);
        const user = await models_1.User.findById(decoded.userId);
        if (!user || !user.isActive) {
            throw (0, errorHandler_1.unauthorized)('Invalid refresh token');
        }
        const tokens = jwt_1.JWTService.generateTokens({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: { tokens },
        });
    }
    catch (error) {
        throw (0, errorHandler_1.unauthorized)('Invalid refresh token');
    }
});
exports.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    res.json({
        success: true,
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                city: user.city,
                specialty: user.specialty,
                companyName: user.companyName,
                bio: user.bio,
                experience: user.experience,
                profileImage: user.profileImage,
                rating: user.rating,
                coordinates: user.coordinates,
                isVerified: user.isVerified,
                isActive: user.isActive,
                documents: user.documents,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
            },
        },
    });
});
exports.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.badRequest)('Validation failed', errors.array());
    }
    const user = req.user;
    const allowedUpdates = ['name', 'phone', 'city', 'specialty', 'bio', 'experience', 'coordinates'];
    const updates = {};
    Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
            if (key === 'coordinates' && req.body[key] && req.body[key].lat && req.body[key].lng) {
                updates[key] = {
                    type: 'Point',
                    coordinates: [req.body[key].lng, req.body[key].lat]
                };
            }
            else {
                updates[key] = req.body[key];
            }
        }
    });
    Object.assign(user, updates);
    await user.save();
    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                city: user.city,
                specialty: user.specialty,
                bio: user.bio,
                experience: user.experience,
                coordinates: user.coordinates,
                profileImage: user.profileImage,
                rating: user.rating,
                isVerified: user.isVerified,
            },
        },
    });
});
exports.changePassword = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw (0, errorHandler_1.badRequest)('Validation failed', errors.array());
    }
    const { currentPassword, newPassword } = req.body;
    const user = await models_1.User.findById(req.user._id).select('+password');
    if (!user) {
        throw (0, errorHandler_1.notFound)('User not found');
    }
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        throw (0, errorHandler_1.unauthorized)('Current password is incorrect');
    }
    user.password = newPassword;
    await user.save();
    res.json({
        success: true,
        message: 'Password changed successfully',
    });
});
exports.logout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});
exports.deactivateAccount = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    user.isActive = false;
    await user.save();
    res.json({
        success: true,
        message: 'Account deactivated successfully',
    });
});
exports.verifyToken = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const user = req.user;
    res.json({
        success: true,
        message: 'Token is valid',
        data: {
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                isVerified: user.isVerified,
                isActive: user.isActive,
            },
        },
    });
});
//# sourceMappingURL=authController.js.map