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
        this.isConnected = false;
    }
    static getInstance() {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
    async connect() {
        if (this.isConnected) {
            console.log('Database already connected');
            return;
        }
        try {
            const mongooseOptions = {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                bufferCommands: true,
                bufferMaxEntries: 0,
                useNewUrlParser: true,
                useUnifiedTopology: true,
            };
            await mongoose_1.default.connect(environment_1.config.database.uri, mongooseOptions);
            this.isConnected = true;
            console.log('✅ MongoDB connected successfully');
            mongoose_1.default.connection.on('error', (error) => {
                console.error('❌ MongoDB connection error:', error);
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.log('⚠️ MongoDB disconnected');
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                console.log('✅ MongoDB reconnected');
                this.isConnected = true;
            });
            process.on('SIGINT', async () => {
                await this.disconnect();
                process.exit(0);
            });
        }
        catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            this.isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.connection.close();
            this.isConnected = false;
            console.log('✅ MongoDB disconnected gracefully');
        }
        catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
    getConnectionStatus() {
        return this.isConnected && mongoose_1.default.connection.readyState === 1;
    }
    async healthCheck() {
        try {
            if (!this.isConnected) {
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