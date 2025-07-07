"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
exports.config = {
    server: {
        port: parseInt(process.env.PORT || '5000', 10),
        env: process.env.NODE_ENV || 'development',
        apiVersion: process.env.API_VERSION || 'v1',
    },
    database: {
        uri: process.env.MONGODB_URI,
    },
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        url: process.env.CLOUDINARY_URL,
    },
    email: {
        from: process.env.EMAIL_FROM || 'noreply@same-mli-connect.com',
        smtp: {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
        },
    },
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
        },
    },
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || [
            'http://localhost:8080',
            'http://localhost:8081',
            'http://localhost:8082',
            'http://localhost:3000',
            'capacitor://localhost',
            'ionic://localhost',
            'http://localhost',
            'https://localhost',
            'file://',
            'capacitor-electron://',
            'capacitor://',
            'ionic://',
            'http://10.0.2.2:8080',
            'http://10.0.2.2:8081',
            'http://10.0.2.2:8082'
        ],
    },
    admin: {
        email: process.env.ADMIN_EMAIL || 'ilyeskhireddinem2cs@gmail.com',
    },
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
        allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
    },
};
if (exports.config.server.env === 'development') {
    console.log('🔧 Configuration loaded:', {
        server: exports.config.server,
        database: { uri: exports.config.database.uri.replace(/\/\/.*@/, '//***:***@') },
        cloudinary: { cloudName: exports.config.cloudinary.cloudName },
        cors: exports.config.cors,
    });
}
//# sourceMappingURL=environment.js.map