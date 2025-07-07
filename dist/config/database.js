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
            try {
                await mongoose_1.default.connection.db?.admin().ping();
                console.log('Database connection verified and healthy');
                return;
            }
            catch (error) {
                console.log('Database connection exists but unhealthy, reconnecting...');
                this.connectionPromise = null;
                await mongoose_1.default.connection.close().catch(() => { });
            }
        }
        if (this.connectionPromise) {
            console.log('Database connection in progress, waiting...');
            return this.connectionPromise;
        }
        if (mongoose_1.default.connection.readyState === 2 || mongoose_1.default.connection.readyState === 3) {
            console.log('Database in transition state, waiting...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return this.connect();
        }
        this.connectionPromise = this.establishConnection();
        return this.connectionPromise;
    }
    async establishConnection() {
        try {
            const mongooseOptions = {
                maxPoolSize: 5,
                minPoolSize: 1,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 20000,
                connectTimeoutMS: 10000,
                bufferCommands: false,
                maxIdleTimeMS: 10000,
                retryWrites: true,
                retryReads: false,
                autoIndex: false,
                family: 4,
            };
            console.log('🔄 Connecting to MongoDB...');
            console.log('🔗 URI:', environment_1.config.database.uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
            if (mongoose_1.default.connection.readyState !== 0) {
                console.log('🔄 Force closing existing connection...');
                await mongoose_1.default.disconnect();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            const connectPromise = mongoose_1.default.connect(environment_1.config.database.uri, mongooseOptions);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
            });
            await Promise.race([connectPromise, timeoutPromise]);
            console.log('🔄 Verifying connection...');
            await mongoose_1.default.connection.db?.admin().ping();
            console.log('✅ MongoDB connected and verified successfully');
            console.log('📊 Connection state:', mongoose_1.default.connection.readyState);
            mongoose_1.default.connection.removeAllListeners();
            mongoose_1.default.connection.on('error', (error) => {
                console.error('❌ MongoDB connection error:', error);
                this.connectionPromise = null;
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.log('⚠️ MongoDB disconnected');
                this.connectionPromise = null;
            });
        }
        catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            this.connectionPromise = null;
            try {
                await mongoose_1.default.disconnect();
            }
            catch (cleanupError) {
                console.error('❌ Cleanup error:', cleanupError);
            }
            throw new Error(`Database connection failed: ${error.message}`);
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