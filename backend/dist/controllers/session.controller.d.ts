import { Response } from 'express';
import { AuthRequest } from '../types';
export declare function startExam(req: AuthRequest, res: Response): Promise<void>;
export declare function saveAnswer(req: AuthRequest, res: Response): Promise<void>;
export declare function submitExam(req: AuthRequest, res: Response): Promise<void>;
export declare function getResult(req: AuthRequest, res: Response): Promise<void>;
export declare function getLastExam(req: AuthRequest, res: Response): Promise<void>;
export declare function getPerformanceSummary(req: AuthRequest, res: Response): Promise<void>;
export declare function adminGetUserSessions(req: any, res: Response): Promise<void>;
//# sourceMappingURL=session.controller.d.ts.map