import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireSelfOrAdmin: (userIdParam?: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireVerified: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireProvider: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const authRateLimit: (maxRequests?: number, windowMs?: number) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const requireResourceOwnership: (resourceModel: any, resourceIdParam?: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map