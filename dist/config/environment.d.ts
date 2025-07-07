interface Config {
    server: {
        port: number;
        env: string;
        apiVersion: string;
    };
    database: {
        uri: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
        url: string;
    };
    email: {
        from: string;
        smtp: {
            host: string;
            port: number;
            user: string;
            pass: string;
        };
    };
    security: {
        bcryptRounds: number;
        rateLimit: {
            windowMs: number;
            maxRequests: number;
        };
    };
    cors: {
        origin: string[];
    };
    admin: {
        email: string;
    };
    upload: {
        maxFileSize: number;
        allowedTypes: string[];
    };
}
export declare const config: Config;
export {};
//# sourceMappingURL=environment.d.ts.map