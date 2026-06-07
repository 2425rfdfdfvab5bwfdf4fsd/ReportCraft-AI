import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            agencyId: string;
            clerkUserId: string;
            teamMemberRole?: string;
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
export declare function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.middleware.d.ts.map