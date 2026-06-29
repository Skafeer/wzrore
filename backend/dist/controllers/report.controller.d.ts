import { Response, Request } from 'express';
import { AuthRequest } from '../types';
export declare function createReport(req: AuthRequest, res: Response): Promise<void>;
export declare function adminGetReports(req: Request, res: Response): Promise<void>;
export declare function adminUpdateReport(req: Request, res: Response): Promise<void>;
export declare function adminDeleteReport(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=report.controller.d.ts.map