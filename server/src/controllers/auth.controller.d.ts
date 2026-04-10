import type { Request, Response } from "express";
export declare const preAuthLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const verifyLoginOtp: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const logout: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=auth.controller.d.ts.map