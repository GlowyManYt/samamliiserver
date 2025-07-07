"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalServerError = exports.conflict = exports.forbidden = exports.unauthorized = exports.badRequest = exports.notFound = exports.asyncHandler = exports.errorHandler = exports.createError = exports.CustomError = void 0;
const environment_1 = require("../config/environment");
class CustomError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
const createError = (message, statusCode = 500) => {
    return new CustomError(message, statusCode);
};
exports.createError = createError;
const errorHandler = (error, req, res, next) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }
    else if (error.name === 'MongoServerError' && error.code === 11000) {
        statusCode = 409;
        message = 'Duplicate field value';
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    else if (error.name === 'MulterError') {
        statusCode = 400;
        if (error.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large';
        }
        else if (error.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files';
        }
        else {
            message = 'File upload error';
        }
    }
    if (environment_1.config.server.env === 'development') {
        console.error('Error:', {
            message: error.message,
            stack: error.stack,
            statusCode,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
    }
    const errorResponse = {
        success: false,
        message,
        ...(environment_1.config.server.env === 'development' && { error: error.stack }),
    };
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const notFound = (message = 'Resource not found') => {
    return new CustomError(message, 404);
};
exports.notFound = notFound;
const badRequest = (message = 'Bad request', details) => {
    const error = new CustomError(message, 400);
    if (details) {
        error.details = details;
    }
    return error;
};
exports.badRequest = badRequest;
const unauthorized = (message = 'Unauthorized') => {
    return new CustomError(message, 401);
};
exports.unauthorized = unauthorized;
const forbidden = (message = 'Forbidden') => {
    return new CustomError(message, 403);
};
exports.forbidden = forbidden;
const conflict = (message = 'Conflict') => {
    return new CustomError(message, 409);
};
exports.conflict = conflict;
const internalServerError = (message = 'Internal server error') => {
    return new CustomError(message, 500);
};
exports.internalServerError = internalServerError;
//# sourceMappingURL=errorHandler.js.map