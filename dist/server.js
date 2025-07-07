"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const environment_1 = require("./config/environment");
const socketHandler_1 = require("./socket/socketHandler");
class Server {
    constructor() {
        this.app = new app_1.default();
        this.server = (0, http_1.createServer)(this.app.getApp());
        this.initializeSocket();
    }
    initializeSocket() {
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: environment_1.config.cors.origin,
                methods: ['GET', 'POST'],
                credentials: true,
            },
            transports: ['websocket', 'polling'],
        });
        this.app.getApp().set('io', this.io);
        (0, socketHandler_1.initializeSocket)(this.io);
    }
    start() {
        this.server.listen(environment_1.config.server.port, () => {
            console.log('🚀 Server Information:');
            console.log(`   Environment: ${environment_1.config.server.env}`);
            console.log(`   Port: ${environment_1.config.server.port}`);
            console.log(`   API Version: ${environment_1.config.server.apiVersion}`);
            console.log(`   Health Check: http://localhost:${environment_1.config.server.port}/health`);
            console.log(`   API Endpoint: http://localhost:${environment_1.config.server.port}/api/${environment_1.config.server.apiVersion}`);
            console.log('');
            console.log('✅ Same MLI Connect Backend is running successfully!');
        });
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully...');
            this.server.close(() => {
                console.log('Process terminated');
                process.exit(0);
            });
        });
        process.on('SIGINT', () => {
            console.log('SIGINT received, shutting down gracefully...');
            this.server.close(() => {
                console.log('Process terminated');
                process.exit(0);
            });
        });
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }
    getServer() {
        return this.server;
    }
    getIO() {
        return this.io;
    }
}
const server = new Server();
server.start();
exports.default = server;
//# sourceMappingURL=server.js.map