import crypto from "crypto";
import bcrypt from "bcrypt";

// Generate a cryptographically secure 6-digit OTP
export const generateSecureOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
