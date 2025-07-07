import { Server as SocketIOServer } from 'socket.io';
declare class Server {
    private app;
    private server;
    private io;
    constructor();
    private initializeSocket;
    start(): void;
    getServer(): any;
    getIO(): SocketIOServer;
}
declare const server: Server;
export default server;
//# sourceMappingURL=server.d.ts.map