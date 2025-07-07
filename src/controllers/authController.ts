import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { User } from '../models';
import { JWTService } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';
import { asyncHandler, badRequest, unauthorized, conflict, notFound } from '../middleware/errorHandler';
import { cloudinaryService } from '../config/cloudinary';

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw badRequest('Validation failed', errors.array());
  }

  const { email, password, name, role, phone, city, specialty, companyName, bio, experience, coordinates, portfolioImages } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw conflict('User with this email already exists');
  }

  // Process coordinates if provided (convert from frontend format to GeoJSON)
  let geoCoordinates;
  if (coordinates && coordinates.lat && coordinates.lng) {
    geoCoordinates = {
      type: 'Point',
      coordinates: [coordinates.lng, coordinates.lat] // GeoJSON format: [longitude, latitude]
    };
  }

  // Create new user first
  const user = await User.create({
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
    portfolioImages: [], // Start with empty array
  });

  // Upload portfolio images to Cloudinary if provided
  let uploadedPortfolioImages: string[] = [];
  if (portfolioImages && Array.isArray(portfolioImages) && portfolioImages.length > 0) {
    console.log(`Uploading ${portfolioImages.length} portfolio images to Cloudinary for user ${user._id}...`);

    for (let i = 0; i < portfolioImages.length; i++) {
      const imageData = portfolioImages[i];

      // Check if it's a base64 data URL
      if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
        try {
          // Convert base64 to buffer
          const base64Data = imageData.split(',')[1];
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // Upload to Cloudinary with actual user ID
          const uploadResult = await cloudinaryService.uploadPortfolioImage(
            imageBuffer,
            user._id.toString(),
            i
          );

          uploadedPortfolioImages.push(uploadResult.secure_url);
          console.log(`Portfolio image ${i + 1} uploaded successfully: ${uploadResult.secure_url}`);
        } catch (error) {
          console.error(`Error uploading portfolio image ${i + 1}:`, error);
          // Continue with other images even if one fails
        }
      } else {
        // If it's already a URL, keep it as is
        uploadedPortfolioImages.push(imageData);
      }
    }

    // Update user with uploaded portfolio images
    if (uploadedPortfolioImages.length > 0) {
      user.portfolioImages = uploadedPortfolioImages;
      await user.save();
      console.log(`Updated user ${user._id} with ${uploadedPortfolioImages.length} portfolio images`);
    }
  }

  // Generate tokens
  const tokens = JWTService.generateTokens({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Update last login
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

/**
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw badRequest('Validation failed', errors.array());
  }

  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw unauthorized('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw unauthorized('Account is deactivated');
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw unauthorized('Invalid email or password');
  }

  // Generate tokens
  const tokens = JWTService.generateTokens({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Update last login
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

/**
 * Refresh access token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw badRequest('Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = JWTService.verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw unauthorized('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = JWTService.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens },
    });
  } catch (error) {
    throw unauthorized('Invalid refresh token');
  }
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user!;

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

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw badRequest('Validation failed', errors.array());
  }

  const user = req.user!;
  const allowedUpdates = ['name', 'phone', 'city', 'specialty', 'bio', 'experience', 'coordinates'];
  const updates: any = {};

  // Only include allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      if (key === 'coordinates' && req.body[key] && req.body[key].lat && req.body[key].lng) {
        // Convert frontend format to GeoJSON
        updates[key] = {
          type: 'Point',
          coordinates: [req.body[key].lng, req.body[key].lat]
        };
      } else {
        updates[key] = req.body[key];
      }
    }
  });

  // Update user
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

/**
 * Change password
 */
export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw badRequest('Validation failed', errors.array());
  }

  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user!._id).select('+password');

  if (!user) {
    throw notFound('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw unauthorized('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * Logout user (client-side token removal)
 */
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // In a stateless JWT system, logout is typically handled client-side
  // by removing the token from storage. However, we can log this action.
  
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Deactivate account
 */
export const deactivateAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user!;
  
  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'Account deactivated successfully',
  });
});

/**
 * Verify token (for client-side token validation)
 */
export const verifyToken = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user!;

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
