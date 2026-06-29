import { Request } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: 'STUDENT' | 'ADMIN';
        plan?: string | null;
    };
}
export interface AdminRequest extends Request {
    admin?: {
        id: string;
        adminRole: 'SUPER_ADMIN' | 'ADMIN';
        permissions: Record<string, boolean>;
    };
}
export interface UserData {
    id: string;
    name: string;
    phone: string;
    province: string;
    avatar?: string | null;
    studyStreak: number;
    subscription?: {
        plan: string;
        status: string;
        endDate: Date;
    } | null;
}
//# sourceMappingURL=index.d.ts.map