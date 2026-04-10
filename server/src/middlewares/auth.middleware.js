import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../db/prisma.js";
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Unauthorized: Missing Token" });
        }
        const token = authHeader.split(" ")[1];
        if (!token)
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid Token Format" });
        const decoded = verifyAccessToken(token);
        // Provide user object on request
        req.user = {
            id: decoded.id,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid or Expired Token" });
    }
};
export const requireVerified = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user || !user.emailVerified) {
            return res.status(403).json({ success: false, message: "Forbidden: Account verification required (2FA)" });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server error during verification check" });
    }
};
//# sourceMappingURL=auth.middleware.js.map