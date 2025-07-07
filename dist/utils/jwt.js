"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../config/environment");
class JWTService {
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, environment_1.config.jwt.secret, {
            expiresIn: environment_1.config.jwt.expiresIn,
        });
    }
    static generateRefreshToken(payload) {
        return jsonwebtoken_1.default.sign(payload, environment_1.config.jwt.refreshSecret, {
            expiresIn: environment_1.config.jwt.refreshExpiresIn,
        });
    }
    static generateTokens(payload) {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
        };
    }
    static verifyAccessToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, environment_1.config.jwt.secret);
        }
        catch (error) {
            throw new Error('Invalid or expired access token');
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, environment_1.config.jwt.refreshSecret);
        }
        catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }
    static decodeToken(token) {
        try {
            return jsonwebtoken_1.default.decode(token);
        }
        catch (error) {
            return null;
        }
    }
    static isTokenExpired(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp)
                return true;
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        }
        catch (error) {
            return true;
        }
    }
    static getTokenExpiration(token) {
        try {
            const decoded = this.decodeToken(token);
            if (!decoded || !decoded.exp)
                return null;
            return new Date(decoded.exp * 1000);
        }
        catch (error) {
            return null;
        }
    }
    static extractTokenFromHeader(authHeader) {
        if (!authHeader)
            return null;
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer')
            return null;
        return parts[1];
    }
}
exports.JWTService = JWTService;
//# sourceMappingURL=jwt.js.map