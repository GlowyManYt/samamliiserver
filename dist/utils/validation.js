"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryValidation = exports.paramValidation = exports.reviewValidation = exports.messageValidation = exports.serviceRequestValidation = exports.userValidation = void 0;
const express_validator_1 = require("express-validator");
exports.userValidation = {
    register: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email'),
        (0, express_validator_1.body)('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        (0, express_validator_1.body)('name')
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters'),
        (0, express_validator_1.body)('role')
            .isIn(['client', 'professional', 'expert'])
            .withMessage('Role must be client, professional, or expert'),
        (0, express_validator_1.body)('phone')
            .optional()
            .matches(/^\+?[\d\s-()]+$/)
            .withMessage('Please provide a valid phone number'),
        (0, express_validator_1.body)('city')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('City cannot exceed 50 characters'),
        (0, express_validator_1.body)('specialty')
            .if((0, express_validator_1.body)('role').isIn(['professional', 'expert']))
            .notEmpty()
            .withMessage('Specialty is required for professionals and experts')
            .isLength({ max: 100 })
            .withMessage('Specialty cannot exceed 100 characters'),
        (0, express_validator_1.body)('companyName')
            .if((0, express_validator_1.body)('role').equals('expert'))
            .notEmpty()
            .withMessage('Company name is required for experts')
            .isLength({ max: 100 })
            .withMessage('Company name cannot exceed 100 characters'),
        (0, express_validator_1.body)('bio')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Bio cannot exceed 500 characters'),
        (0, express_validator_1.body)('experience')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Experience cannot exceed 50 characters'),
    ],
    login: [
        (0, express_validator_1.body)('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email'),
        (0, express_validator_1.body)('password')
            .notEmpty()
            .withMessage('Password is required'),
    ],
    updateProfile: [
        (0, express_validator_1.body)('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be between 2 and 100 characters'),
        (0, express_validator_1.body)('phone')
            .optional()
            .matches(/^\+?[\d\s-()]+$/)
            .withMessage('Please provide a valid phone number'),
        (0, express_validator_1.body)('city')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('City cannot exceed 50 characters'),
        (0, express_validator_1.body)('specialty')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Specialty cannot exceed 100 characters'),
        (0, express_validator_1.body)('bio')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Bio cannot exceed 500 characters'),
        (0, express_validator_1.body)('experience')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('Experience cannot exceed 50 characters'),
        (0, express_validator_1.body)('coordinates.lat')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Latitude must be between -90 and 90'),
        (0, express_validator_1.body)('coordinates.lng')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Longitude must be between -180 and 180'),
    ],
    changePassword: [
        (0, express_validator_1.body)('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        (0, express_validator_1.body)('newPassword')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    ],
};
exports.serviceRequestValidation = {
    create: [
        (0, express_validator_1.body)('provider')
            .isMongoId()
            .withMessage('Invalid provider ID'),
        (0, express_validator_1.body)('service')
            .isIn([
            'تصميم داخلي',
            'هندسة معمارية',
            'نجارة وديكور',
            'كهرباء',
            'سباكة',
            'دهان وديكور',
            'تصميم جرافيك',
            'تطوير مواقع',
            'أخرى'
        ])
            .withMessage('Invalid service type'),
        (0, express_validator_1.body)('description')
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Description must be between 10 and 1000 characters'),
        (0, express_validator_1.body)('budget.min')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Minimum budget must be a positive number'),
        (0, express_validator_1.body)('budget.max')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('Maximum budget must be a positive number')
            .custom((value, { req }) => {
            if (req.body.budget?.min && value < req.body.budget.min) {
                throw new Error('Maximum budget must be greater than or equal to minimum budget');
            }
            return true;
        }),
        (0, express_validator_1.body)('budget.currency')
            .optional()
            .isIn(['SAR', 'USD', 'EUR'])
            .withMessage('Invalid currency'),
        (0, express_validator_1.body)('deadline')
            .optional()
            .isISO8601()
            .withMessage('Invalid deadline format')
            .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error('Deadline must be in the future');
            }
            return true;
        }),
        (0, express_validator_1.body)('location.address')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Address cannot exceed 200 characters'),
        (0, express_validator_1.body)('location.coordinates.lat')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Latitude must be between -90 and 90'),
        (0, express_validator_1.body)('location.coordinates.lng')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Longitude must be between -180 and 180'),
    ],
    updateStatus: [
        (0, express_validator_1.body)('status')
            .isIn(['pending', 'accepted', 'in_progress', 'completed', 'cancelled'])
            .withMessage('Invalid status'),
    ],
};
exports.messageValidation = {
    send: [
        (0, express_validator_1.body)('recipient')
            .isMongoId()
            .withMessage('Invalid recipient ID'),
        (0, express_validator_1.body)('content')
            .trim()
            .isLength({ min: 1, max: 1000 })
            .withMessage('Message content must be between 1 and 1000 characters'),
        (0, express_validator_1.body)('messageType')
            .optional()
            .isIn(['text', 'image', 'file'])
            .withMessage('Invalid message type'),
        (0, express_validator_1.body)('serviceRequest')
            .optional()
            .isMongoId()
            .withMessage('Invalid service request ID'),
    ],
};
exports.reviewValidation = {
    create: [
        (0, express_validator_1.body)('reviewee')
            .isMongoId()
            .withMessage('Invalid reviewee ID'),
        (0, express_validator_1.body)('serviceRequest')
            .isMongoId()
            .withMessage('Invalid service request ID'),
        (0, express_validator_1.body)('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('Rating must be between 1 and 5'),
        (0, express_validator_1.body)('comment')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Comment cannot exceed 500 characters'),
    ],
};
exports.paramValidation = {
    mongoId: (paramName = 'id') => (0, express_validator_1.param)(paramName)
        .isMongoId()
        .withMessage(`Invalid ${paramName}`),
};
const paginationValidation = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    (0, express_validator_1.query)('sort')
        .optional()
        .isString()
        .withMessage('Sort must be a string'),
    (0, express_validator_1.query)('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Order must be asc or desc'),
];
exports.queryValidation = {
    pagination: paginationValidation,
    userSearch: [
        ...paginationValidation,
        (0, express_validator_1.query)('role')
            .optional()
            .isIn(['all', 'client', 'professional', 'expert'])
            .withMessage('Invalid role filter'),
        (0, express_validator_1.query)('city')
            .optional()
            .trim()
            .isLength({ max: 50 })
            .withMessage('City filter cannot exceed 50 characters'),
        (0, express_validator_1.query)('specialty')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Specialty filter cannot exceed 100 characters'),
        (0, express_validator_1.query)('search')
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage('Search term cannot exceed 100 characters'),
        (0, express_validator_1.query)('rating')
            .optional()
            .isFloat({ min: 0, max: 5 })
            .withMessage('Rating filter must be between 0 and 5'),
    ],
};
//# sourceMappingURL=validation.js.map