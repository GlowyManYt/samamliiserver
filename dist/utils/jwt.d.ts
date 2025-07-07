import { JWTPayload } from '../types';
export declare class JWTService {
    static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string;
    static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string;
    static generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): {
        accessToken: string;
        refreshToken: string;
    };
    static verifyAccessToken(token: string): JWTPayload;
    static verifyRefreshToken(token: string): JWTPayload;
    static decodeToken(token: string): JWTPayload | null;
    static isTokenExpired(token: string): boolean;
    static getTokenExpiration(token: string): Date | null;
    static extractTokenFromHeader(authHeader: string | undefined): string | null;
}
//# sourceMappingURL=jwt.d.ts.map