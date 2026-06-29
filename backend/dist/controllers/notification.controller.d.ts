import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare function saveFcmToken(req: AuthRequest, res: Response): Promise<void>;
export declare function adminSendToUser(req: Request, res: Response): Promise<void>;
export declare function adminSendToAll(req: Request, res: Response): Promise<void>;
export declare function adminGetNotifications(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=notification.controller.d.ts.map