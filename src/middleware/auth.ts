import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { JWTService } from '../utils/jwt';
import { AuthenticatedRequest } from '../types';
import { unauthorized, forbidden } from './errorHandler';
import { config } from '../config/environment';

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('=== Authentication middleware called ===');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Authorization header:', req.headers.authorization);

    const token = JWTService.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw unauthorized('Access token is required');
    }

    // Verify token
    const decoded = JWTService.verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId).select('+password');
    if (!user) {
      throw unauthorized('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw forbidden('Account is deactivated');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware - doesn't throw error if no token
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = JWTService.extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = JWTService.verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(forbidden('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Admin authorization middleware
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(unauthorized('Authentication required'));
  }

  // Check if user is admin by email
  if (req.user.email !== config.admin.email) {
    return next(forbidden('Admin access required'));
  }

  next();
};

/**
 * Self or admin authorization middleware
 */
export const requireSelfOrAdmin = (userIdParam: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(unauthorized('Authentication required'));
    }

    const targetUserId = req.params[userIdParam];
    const isAdmin = req.user.email === config.admin.email;
    const isSelf = req.user._id.toString() === targetUserId;

    if (!isAdmin && !isSelf) {
      return next(forbidden('You can only access your own resources'));
    }

    next();
  };
};

/**
 * Verified user middleware - requires user to be verified
 */
export const requireVerified = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(unauthorized('Authentication required'));
  }

  if (!req.user.isVerified) {
    return next(forbidden('Account verification required'));
  }

  next();
};

/**
 * Professional or Expert authorization middleware
 */
export const requireProvider = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(unauthorized('Authentication required'));
  }

  if (!['professional', 'expert'].includes(req.user.role)) {
    return next(forbidden('Provider access required'));
  }

  next();
};

/**
 * Rate limiting for authenticated users
 */
export const authRateLimit = (maxRequests: number = 1000, windowMs: number = 3600000) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
      return next(forbidden('Rate limit exceeded for authenticated user'));
    }

    userLimit.count++;
    next();
  };
};

/**
 * Middleware to check if user owns a resource
 */
export const requireResourceOwnership = (resourceModel: any, resourceIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(unauthorized('Authentication required'));
      }

      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return next(new Error('Resource not found'));
      }

      // Check if user is admin
      if (req.user.email === config.admin.email) {
        return next();
      }

      // Check ownership based on different possible fields
      const userId = req.user._id.toString();
      const isOwner = 
        resource.user?.toString() === userId ||
        resource.owner?.toString() === userId ||
        resource.uploadedBy?.toString() === userId ||
        resource.client?.toString() === userId ||
        resource.provider?.toString() === userId;

      if (!isOwner) {
        return next(forbidden('You do not have permission to access this resource'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
