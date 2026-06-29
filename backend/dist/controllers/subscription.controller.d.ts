import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare function redeemCode(req: AuthRequest, res: Response): Promise<void>;
export declare function getMySubscription(req: AuthRequest, res: Response): Promise<void>;
export declare function adminGetCodes(req: Request, res: Response): Promise<void>;
export declare function adminCreateCodes(req: Request, res: Response): Promise<void>;
export declare function adminDeleteCode(req: Request, res: Response): Promise<void>;
export declare function adminActivateSubscription(req: Request, res: Response): Promise<void>;
export declare function adminCancelSubscription(req: Request, res: Response): Promise<void>;
export declare function adminGetLaunchPeriod(req: Request, res: Response): Promise<void>;
export declare function adminSetLaunchPeriod(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=subscription.controller.d.ts.map