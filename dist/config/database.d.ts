declare class Database {
    private static instance;
    private connectionPromise;
    private constructor();
    static getInstance(): Database;
    connect(): Promise<void>;
    private establishConnection;
    disconnect(): Promise<void>;
    getConnectionStatus(): boolean;
    healthCheck(): Promise<{
        status: string;
        message: string;
    }>;
}
export declare const database: Database;
export {};
//# sourceMappingURL=database.d.ts.map