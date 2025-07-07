"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const environment_1 = require("./config/environment");
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const notFoundHandler_1 = require("./middleware/notFoundHandler");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const serviceRequestRoutes_1 = __importDefault(require("./routes/serviceRequestRoutes"));
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.ensureDatabaseConnection();
    }
    ensureDatabaseConnection() {
        this.app.use(async (req, res, next) => {
            try {
                await database_1.database.connect();
                next();
            }
            catch (error) {
                console.error('❌ Database connection failed:', error);
                res.status(503).json({
                    success: false,
                    message: 'Database connection failed',
                    error: process.env.NODE_ENV === 'development' ? error : 'Service temporarily unavailable'
                });
            }
        });
    }
    initializeMiddlewares() {
        this.app.use((0, helmet_1.default)({
            crossOriginResourcePolicy: { policy: "cross-origin" }
        }));
        const allowedOrigins = environment_1.config.cors.origin;
        this.app.use((0, cors_1.default)({
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    console.warn(`🚨 CORS violation: Blocked origin ${origin}`);
                    callback(null, true);
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
            exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
            preflightContinue: false,
            optionsSuccessStatus: 200
        }));
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
            res.header('Access-Control-Allow-Credentials', 'true');
            next();
        });
        this.app.use((0, compression_1.default)());
        if (environment_1.config.server.env === 'development') {
            this.app.use((0, morgan_1.default)('dev'));
        }
        else {
            this.app.use((0, morgan_1.default)('combined'));
        }
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.get('/health', async (req, res) => {
            const dbHealth = await database_1.database.healthCheck();
            res.status(dbHealth.status === 'healthy' ? 200 : 503).json({
                success: dbHealth.status === 'healthy',
                message: 'Same MLI Connect API Health Check',
                timestamp: new Date().toISOString(),
                environment: environment_1.config.server.env,
                version: environment_1.config.server.apiVersion,
                database: dbHealth,
            });
        });
        this.app.get('/api', (req, res) => {
            res.json({
                success: true,
                message: 'Same MLI Connect API',
                version: environment_1.config.server.apiVersion,
                environment: environment_1.config.server.env,
                timestamp: new Date().toISOString(),
                endpoints: {
                    auth: `/api/${environment_1.config.server.apiVersion}/auth`,
                    users: `/api/${environment_1.config.server.apiVersion}/users`,
                    services: `/api/${environment_1.config.server.apiVersion}/services`,
                    messages: `/api/${environment_1.config.server.apiVersion}/messages`,
                    files: `/api/${environment_1.config.server.apiVersion}/files`,
                    admin: `/api/${environment_1.config.server.apiVersion}/admin`,
                },
            });
        });
    }
    initializeRoutes() {
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'Same MLI Connect API is running',
                version: environment_1.config.server.apiVersion,
                timestamp: new Date().toISOString(),
                endpoints: {
                    auth: `/api/${environment_1.config.server.apiVersion}/auth`,
                    users: `/api/${environment_1.config.server.apiVersion}/users`,
                    messages: `/api/${environment_1.config.server.apiVersion}/messages`,
                    serviceRequests: `/api/${environment_1.config.server.apiVersion}/service-requests`
                }
            });
        });
        this.app.get('/health', (req, res) => {
            res.json({
                success: true,
                message: 'API is healthy',
                timestamp: new Date().toISOString()
            });
        });
        this.app.use(`/api/${environment_1.config.server.apiVersion}/auth`, auth_1.default);
        this.app.use(`/api/${environment_1.config.server.apiVersion}/users`, users_1.default);
        this.app.use(`/api/${environment_1.config.server.apiVersion}/messages`, messageRoutes_1.default);
        this.app.use(`/api/${environment_1.config.server.apiVersion}/service-requests`, serviceRequestRoutes_1.default);
        this.app.get(`/api/${environment_1.config.server.apiVersion}`, (req, res) => {
            res.json({
                success: true,
                message: `Same MLI Connect API ${environment_1.config.server.apiVersion}`,
                timestamp: new Date().toISOString(),
            });
        });
    }
    initializeErrorHandling() {
        this.app.use(notFoundHandler_1.notFoundHandler);
        this.app.use(errorHandler_1.errorHandler);
    }
    getApp() {
        return this.app;
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map