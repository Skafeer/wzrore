import { Request, Response } from 'express';
export declare function getSubjects(req: Request, res: Response): Promise<void>;
export declare function getChaptersBySubject(req: Request, res: Response): Promise<void>;
export declare function getTopicsByChapter(req: Request, res: Response): Promise<void>;
export declare function adminGetSubjects(req: Request, res: Response): Promise<void>;
export declare function createSubject(req: Request, res: Response): Promise<void>;
export declare function updateSubject(req: Request, res: Response): Promise<void>;
export declare function deleteSubject(req: Request, res: Response): Promise<void>;
export declare function adminGetChapters(req: Request, res: Response): Promise<void>;
export declare function createChapter(req: Request, res: Response): Promise<void>;
export declare function updateChapter(req: Request, res: Response): Promise<void>;
export declare function deleteChapter(req: Request, res: Response): Promise<void>;
export declare function createTopic(req: Request, res: Response): Promise<void>;
export declare function updateTopic(req: Request, res: Response): Promise<void>;
export declare function deleteTopic(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=subject.controller.d.ts.map