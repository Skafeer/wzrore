import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare function getProfile(req: AuthRequest, res: Response): Promise<void>;
export declare function updateProfile(req: AuthRequest, res: Response): Promise<void>;
export declare function changePassword(req: AuthRequest, res: Response): Promise<void>;
export declare function adminGetUsers(req: Request, res: Response): Promise<void>;
export declare function adminUpdateUser(req: Request, res: Response): Promise<void>;
export declare function adminUpdateUserFull(req: Request, res: Response): Promise<void>;
export declare function adminDeleteUser(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=user.controller.d.ts.map