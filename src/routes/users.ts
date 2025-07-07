import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with optional filtering
 * @access  Public
 * @query   role, city, specialty, lat, lng, maxDistance, page, limit
 */
router.get('/', userController.getUsers.bind(userController));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get('/:id', userController.getUserById.bind(userController));

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, userController.updateProfile.bind(userController));

export default router;
