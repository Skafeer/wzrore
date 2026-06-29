import { Request, Response } from 'express';
import { AuthRequest } from '../types';
export declare function getExams(req: AuthRequest, res: Response): Promise<void>;
export declare function getAvailableYears(req: AuthRequest, res: Response): Promise<void>;
export declare function getAvailableRounds(req: AuthRequest, res: Response): Promise<void>;
export declare function adminGetExams(req: Request, res: Response): Promise<void>;
export declare function adminCreateExam(req: Request, res: Response): Promise<void>;
export declare function adminUpdateExam(req: Request, res: Response): Promise<void>;
export declare function adminDeleteExam(req: Request, res: Response): Promise<void>;
export declare function adminGetQuestions(req: Request, res: Response): Promise<void>;
export declare function adminCreateQuestion(req: Request, res: Response): Promise<void>;
export declare function adminUpdateQuestion(req: Request, res: Response): Promise<void>;
export declare function adminDeleteQuestion(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=exam.controller.d.ts.map