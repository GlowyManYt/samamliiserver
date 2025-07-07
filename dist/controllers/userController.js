"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const User_1 = require("../models/User");
class UserController {
    async getUsers(req, res, next) {
        try {
            const { role, city, specialty, lat, lng, maxDistance = '50', page = '1', limit = '1000' } = req.query;
            const filter = {
                isActive: true
            };
            if (role) {
                const roles = role.split(',').map(r => r.trim());
                filter.role = { $in: roles };
            }
            if (city) {
                filter.city = { $regex: city, $options: 'i' };
            }
            if (specialty) {
                filter.specialty = { $regex: specialty, $options: 'i' };
            }
            const pageNum = parseInt(page, 10);
            const limitNum = parseInt(limit, 10);
            const skip = (pageNum - 1) * limitNum;
            let users;
            let total;
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
                const pipeline = [
                    {
                        $geoNear: {
                            near: {
                                type: 'Point',
                                coordinates: [longitude, latitude]
                            },
                            distanceField: 'distance',
                            maxDistance: maxDistanceKm * 1000,
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
                users = await User_1.User.aggregate(pipeline);
                const countPipeline = [
                    {
                        $geoNear: {
                            near: {
                                type: 'Point',
                                coordinates: [longitude, latitude]
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
                const countResult = await User_1.User.aggregate(countPipeline);
                total = countResult.length > 0 ? countResult[0].total : 0;
            }
            else {
                users = await User_1.User.find(filter)
                    .select('-password -refreshTokens')
                    .skip(skip)
                    .limit(limitNum)
                    .sort({ createdAt: -1 })
                    .lean();
                total = await User_1.User.countDocuments(filter);
            }
            users = users.map((user) => {
                const userObj = { ...user };
                if (userObj.distance !== undefined) {
                    userObj.distance = Math.round((userObj.distance / 1000) * 100) / 100;
                }
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
        }
        catch (error) {
            next(error);
        }
    }
    async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            const user = await User_1.User.findById(id)
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
        }
        catch (error) {
            next(error);
        }
    }
    async updateProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            const updates = req.body;
            delete updates.password;
            delete updates.email;
            delete updates.role;
            delete updates.isVerified;
            delete updates.isActive;
            delete updates.refreshTokens;
            const user = await User_1.User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).select('-password -refreshTokens');
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
        }
        catch (error) {
            next(error);
        }
    }
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
//# sourceMappingURL=userController.js.map