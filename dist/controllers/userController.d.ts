import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
export declare class UserController {
    getUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
    getUserById(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    private calculateDistance;
    private toRadians;
}
export declare const userController: UserController;
//# sourceMappingURL=userController.d.ts.map