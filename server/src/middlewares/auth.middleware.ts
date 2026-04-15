import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../db/prisma.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn(`[AUTH] Unauthorized access attempt: ${!authHeader ? 'Missing' : 'Invalid format'} Authorization header`);
      return res.status(401).json({ success: false, message: "Unauthorized: Missing Token" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.warn("[AUTH] Unauthorized access attempt: Empty token value");
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid Token Format" });
    }
    
    const decoded = verifyAccessToken(token);
    
    // Security Hook: Verify Token Version for global session termination
    const userSession = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { tokenVersion: true, status: true }
    });

    if (!userSession || userSession.status === 'suspended') {
      return res.status(401).json({ success: false, message: "Unauthorized: Account Access Revoked" });
    }

    // If token has a version, it must match the current database version
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== userSession.tokenVersion) {
      console.warn(`[AUTH] Session Purge detected: UserID ${decoded.id} using stale token version ${decoded.tokenVersion} (Current: ${userSession.tokenVersion})`);
      return res.status(401).json({ success: false, message: "Unauthorized: Session invalidated by security protocol" });
    }

    console.log(`[AUTH] Identity verified: UserID ${decoded.id} (Role: ${decoded.role})`);

    // Provide user object on request
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    console.error("[AUTH] JWT Verification Failure:", error.message);
    return res.status(401).json({ success: false, message: "Unauthorized: Invalid or Expired Token" });
  }
};

export const requireVerified = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
       return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.emailVerified) {
       return res.status(403).json({ success: false, message: "Forbidden: Account verification required (2FA)" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error during verification check" });
  }
};
