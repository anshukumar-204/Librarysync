import crypto from "crypto";
import bcrypt from "bcrypt";
// Generate a cryptographically secure 6-digit OTP
export const generateSecureOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 12);
};
export const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};
//# sourceMappingURL=security.js.map