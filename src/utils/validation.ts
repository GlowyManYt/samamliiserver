import { body, param, query, ValidationChain } from 'express-validator';

// User validation rules
export const userValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('role')
      .isIn(['client', 'professional', 'expert'])
      .withMessage('Role must be client, professional, or expert'),
    body('phone')
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage('Please provide a valid phone number'),
    body('city')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('City cannot exceed 50 characters'),
    body('specialty')
      .if(body('role').isIn(['professional', 'expert']))
      .notEmpty()
      .withMessage('Specialty is required for professionals and experts')
      .isLength({ max: 100 })
      .withMessage('Specialty cannot exceed 100 characters'),
    body('companyName')
      .if(body('role').equals('expert'))
      .notEmpty()
      .withMessage('Company name is required for experts')
      .isLength({ max: 100 })
      .withMessage('Company name cannot exceed 100 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('experience')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Experience cannot exceed 50 characters'),
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .matches(/^\+?[\d\s-()]+$/)
      .withMessage('Please provide a valid phone number'),
    body('city')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('City cannot exceed 50 characters'),
    body('specialty')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Specialty cannot exceed 100 characters'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    body('experience')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Experience cannot exceed 50 characters'),
    body('coordinates.lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('coordinates.lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
};

// Service request validation rules
export const serviceRequestValidation = {
  create: [
    body('provider')
      .isMongoId()
      .withMessage('Invalid provider ID'),
    body('service')
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
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('budget.min')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum budget must be a positive number'),
    body('budget.max')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum budget must be a positive number')
      .custom((value, { req }) => {
        if (req.body.budget?.min && value < req.body.budget.min) {
          throw new Error('Maximum budget must be greater than or equal to minimum budget');
        }
        return true;
      }),
    body('budget.currency')
      .optional()
      .isIn(['SAR', 'USD', 'EUR'])
      .withMessage('Invalid currency'),
    body('deadline')
      .optional()
      .isISO8601()
      .withMessage('Invalid deadline format')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Deadline must be in the future');
        }
        return true;
      }),
    body('location.address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address cannot exceed 200 characters'),
    body('location.coordinates.lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('location.coordinates.lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
  ],

  updateStatus: [
    body('status')
      .isIn(['pending', 'accepted', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
  ],
};

// Message validation rules
export const messageValidation = {
  send: [
    body('recipient')
      .isMongoId()
      .withMessage('Invalid recipient ID'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message content must be between 1 and 1000 characters'),
    body('messageType')
      .optional()
      .isIn(['text', 'image', 'file'])
      .withMessage('Invalid message type'),
    body('serviceRequest')
      .optional()
      .isMongoId()
      .withMessage('Invalid service request ID'),
  ],
};

// Review validation rules
export const reviewValidation = {
  create: [
    body('reviewee')
      .isMongoId()
      .withMessage('Invalid reviewee ID'),
    body('serviceRequest')
      .isMongoId()
      .withMessage('Invalid service request ID'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Comment cannot exceed 500 characters'),
  ],
};

// Common parameter validations
export const paramValidation = {
  mongoId: (paramName: string = 'id'): ValidationChain =>
    param(paramName)
      .isMongoId()
      .withMessage(`Invalid ${paramName}`),
};

// Query parameter validations
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isString()
    .withMessage('Sort must be a string'),
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
];

export const queryValidation = {
  pagination: paginationValidation,

  userSearch: [
    ...paginationValidation,
    query('role')
      .optional()
      .isIn(['all', 'client', 'professional', 'expert'])
      .withMessage('Invalid role filter'),
    query('city')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('City filter cannot exceed 50 characters'),
    query('specialty')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Specialty filter cannot exceed 100 characters'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term cannot exceed 100 characters'),
    query('rating')
      .optional()
      .isFloat({ min: 0, max: 5 })
      .withMessage('Rating filter must be between 0 and 5'),
  ],
};
