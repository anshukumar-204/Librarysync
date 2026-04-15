import { UAParser } from "ua-parser-js";
import { prisma } from "../db/prisma.js";

export interface SessionInfo {
  userAgent: string;
  ipAddress: string;
}

export const recordSession = async (userId: number, info: SessionInfo) => {
  const parser = new UAParser(info.userAgent);
  const result = parser.getResult();

  const deviceType = result.device.type || "desktop";
  const browser = `${result.browser.name || "Unknown"} ${result.browser.version || ""}`.trim();
  const os = `${result.os.name || "Unknown"} ${result.os.version || ""}`.trim();

  return await prisma.userSession.create({
    data: {
      userId,
      userAgent: info.userAgent,
      ipAddress: info.ipAddress,
      deviceType,
      browser,
      os,
    },
  });
};

export const getUserSessions = async (userId: number) => {
  return await prisma.userSession.findMany({
    where: { userId },
    orderBy: { lastActiveAt: "desc" },
  });
};

export const revokeSession = async (sessionId: string, userId: number) => {
  return await prisma.userSession.delete({
    where: { 
      id: sessionId,
      userId // Security: Ensure session belongs to user
    },
  });
};

export const revokeAllOtherSessions = async (sessionId: string, userId: number) => {
  return await prisma.userSession.deleteMany({
    where: {
      userId,
      id: { not: sessionId }
    }
  });
};

export const revokeAllUserSessions = async (userId: number) => {
  return await prisma.userSession.deleteMany({
    where: { userId }
  });
};
