import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';

interface GetUsersQuery {
  role?: string;
  city?: string;
  specialty?: string;
  lat?: string;
  lng?: string;
  maxDistance?: string;
  page?: string;
  limit?: string;
}

export class UserController {
  /**
   * Get all users with optional filtering
   */
  public async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        role,
        city,
        specialty,
        lat,
        lng,
        maxDistance = '50', // Default 50km radius
        page = '1',
        limit = '1000' // Increased limit to show all users
      } = req.query as GetUsersQuery;

      // Build filter object
      const filter: any = {
        isActive: true
        // Note: Removed isVerified requirement to show all active users
        // isVerified: true
      };

      // Role filtering - support comma-separated roles
      if (role) {
        const roles = role.split(',').map(r => r.trim());
        filter.role = { $in: roles };
      }

      // City filtering
      if (city) {
        filter.city = { $regex: city, $options: 'i' };
      }

      // Specialty filtering
      if (specialty) {
        filter.specialty = { $regex: specialty, $options: 'i' };
      }

      // Pagination
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      let users;
      let total;

      // Location-based filtering
      if (lat && lng) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const maxDistanceKm = parseFloat(maxDistance);

        if (isNaN(latitude) || isNaN(longitude) || isNaN(maxDistanceKm)) {
          res.status(400).json({
            success: false,
            message: 'Invalid coordinates or distance parameters'
          });
          return;
        }

        // Use MongoDB aggregation pipeline with $geoNear for geospatial queries
        const pipeline: any[] = [
          {
            $geoNear: {
              near: {
                type: 'Point' as const,
                coordinates: [longitude, latitude] as [number, number]
              },
              distanceField: 'distance',
              maxDistance: maxDistanceKm * 1000, // Convert km to meters
              spherical: true,
              query: filter
            }
          },
          {
            $project: {
              password: 0,
              refreshTokens: 0
            }
          },
          {
            $skip: skip
          },
          {
            $limit: limitNum
          }
        ];

        users = await User.aggregate(pipeline);

        // Count total documents for pagination
        const countPipeline: any[] = [
          {
            $geoNear: {
              near: {
                type: 'Point' as const,
                coordinates: [longitude, latitude] as [number, number]
              },
              distanceField: 'distance',
              maxDistance: maxDistanceKm * 1000,
              spherical: true,
              query: filter
            }
          },
          {
            $count: 'total'
          }
        ];

        const countResult = await User.aggregate(countPipeline);
        total = countResult.length > 0 ? countResult[0].total : 0;
      } else {
        // Regular filtering without location
        users = await User.find(filter)
          .select('-password -refreshTokens')
          .skip(skip)
          .limit(limitNum)
          .sort({ createdAt: -1 })
          .lean();

        total = await User.countDocuments(filter);
      }

      // Convert GeoJSON format to frontend format and handle distance
      users = users.map((user: any) => {
        const userObj = { ...user };

        // Convert distance from meters to kilometers if it exists (from $geoNear)
        if (userObj.distance !== undefined) {
          userObj.distance = Math.round((userObj.distance / 1000) * 100) / 100; // Convert to km and round to 2 decimals
        }

        // Convert GeoJSON coordinates to frontend format
        if (userObj.coordinates && userObj.coordinates.coordinates && userObj.coordinates.coordinates.length === 2) {
          const [userLng_coord, userLat_coord] = userObj.coordinates.coordinates;
          userObj.coordinates = {
            lat: userLat_coord,
            lng: userLng_coord
          };
        }

        return userObj;
      });

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await User.findById(id)
        .select('-password -refreshTokens')
        .lean();

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  public async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated via this endpoint
      delete updates.password;
      delete updates.email;
      delete updates.role;
      delete updates.isVerified;
      delete updates.isActive;
      delete updates.refreshTokens;

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password -refreshTokens');

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const userController = new UserController();
