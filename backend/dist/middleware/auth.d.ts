import { Response, NextFunction } from 'express';
import { AuthRequest, AdminRequest } from '../types';
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function adminMiddleware(req: AdminRequest, res: Response, next: NextFunction): Promise<void>;
export declare function superAdminMiddleware(req: AdminRequest, res: Response, next: NextFunction): void;
export declare function requirePermission(page: string): (req: AdminRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map