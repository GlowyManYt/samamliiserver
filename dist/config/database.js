"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const environment_1 = require("./environment");
class Database {
    constructor() {
        this.connectionPromise = null;
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        if (mongoose_1.default.connection.readyState === 1) {
            console.log('Database already connected');
            return;
        }
        if (this.connectionPromise) {
            console.log('Database connection in progress, waiting...');
            return this.connectionPromise;
        }
        this.connectionPromise = this.establishConnection();
        return this.connectionPromise;
    }
    async establishConnection() {
        try {
            const mongooseOptions = {
                maxPoolSize: 5,
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
            };
            console.log('🔄 Connecting to MongoDB...');
            await mongoose_1.default.connect(environment_1.config.database.uri, mongooseOptions);
            console.log('✅ MongoDB connected successfully');
            mongoose_1.default.connection.on('error', (error) => {
                console.error('❌ MongoDB connection error:', error);
                this.connectionPromise = null;
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.log('⚠️ MongoDB disconnected');
                this.connectionPromise = null;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                console.log('✅ MongoDB reconnected');
            });
        }
        catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            this.connectionPromise = null;
            throw error;
        }
    }
    async disconnect() {
        if (mongoose_1.default.connection.readyState === 0) {
            return;
        }
        try {
            await mongoose_1.default.connection.close();
            this.connectionPromise = null;
            console.log('✅ MongoDB disconnected gracefully');
        }
        catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
    getConnectionStatus() {
        return mongoose_1.default.connection.readyState === 1;
    }
    async healthCheck() {
        try {
            await this.connect();
            if (mongoose_1.default.connection.readyState !== 1) {
                return { status: 'error', message: 'Database not connected' };
            }
            await mongoose_1.default.connection.db?.admin().ping();
            return {
                status: 'healthy',
                message: `Connected to ${mongoose_1.default.connection.name} database`
            };
        }
        catch (error) {
            return {
                status: 'error',
                message: `Database health check failed: ${error}`
            };
        }
    }
}
exports.database = Database.getInstance();
//# sourceMappingURL=database.js.map