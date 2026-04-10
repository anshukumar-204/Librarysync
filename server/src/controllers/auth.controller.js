import { prisma } from "../db/prisma.js";
import { generateSecureOTP, hashPassword, verifyPassword } from "../utils/security.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import nodemailer from "nodemailer";
// Setup mailer (Mocked if environment variables are missing)
const useMockMailer = !process.env.SMTP_HOST || !process.env.SMTP_USER;
let transporter;
if (!useMockMailer) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}
const sendOtpEmail = async (email, otp, subject) => {
    if (useMockMailer) {
        console.log(`[MOCK EMAIL] To: ${email} | Subject: ${subject} | OTP: ${otp}`);
        return;
    }
    await transporter.sendMail({
        from: process.env.SENDER_EMAIL || '"Library Auth" <no-reply@library.com>',
        to: email,
        subject,
        html: `<b>Your OTP is: ${otp}</b><br/>This OTP will expire in 15 minutes.`,
    });
};
export const preAuthLogin = async (req, res) => {
    const { mobile, password } = req.body;
    if (!mobile || !password)
        return res.status(400).json({ success: false, message: "Missing credentials" });
    try {
        const user = await prisma.user.findUnique({ where: { mobile } });
        // Generic error to prevent enumeration
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        // Check brute force
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            return res.status(403).json({ success: false, message: "Account is temporarily locked. Try again later." });
        }
        const isMatch = await verifyPassword(password, user.passwordHash);
        if (!isMatch) {
            const attempts = user.failedLoginAttempts + 1;
            const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
            await prisma.user.update({
                where: { id: user.id },
                data: { failedLoginAttempts: attempts, lockedUntil }
            });
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        // Passwords match! Reset attempts and generate OTP
        const otp = generateSecureOTP();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                verifyOtp: otp,
                verifyOtpExpiresAt: expiresAt,
                // Reset email verification to force 2FA on every login
                emailVerified: false
            }
        });
        if (user.email) {
            await sendOtpEmail(user.email, otp, "Login Verification OTP");
        }
        else {
            console.log(`No email linked for user ${user.mobile}. OTP is: ${otp}`);
        }
        // Return ONLY a temporary loginID, not the actual JWT tokens
        return res.json({
            success: true,
            message: "OTP sent. Please verify.",
            loginId: user.id // In production, this can also be an encrypted temporary token
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const verifyLoginOtp = async (req, res) => {
    const { loginId, otp } = req.body;
    if (!loginId || !otp)
        return res.status(400).json({ success: false, message: "Missing OTP or Login ID" });
    try {
        const user = await prisma.user.findUnique({ where: { id: Number(loginId) } });
        if (!user)
            return res.status(401).json({ success: false, message: "Invalid request" });
        if (!user.verifyOtp || user.verifyOtp !== otp || !user.verifyOtpExpiresAt || user.verifyOtpExpiresAt < new Date()) {
            return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
        }
        // OTP Verified! Issue real tokens
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                verifyOtp: null,
                verifyOtpExpiresAt: null,
                lastLoginAt: new Date()
            }
        });
        const accessToken = generateAccessToken({ id: user.id, role: user.role });
        const refreshToken = generateRefreshToken({ id: user.id, tokenVersion: user.tokenVersion });
        // Set HTTP-Only Cookie for Refresh Token
        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.json({
            success: true,
            accessToken, // Returned in JSON for the frontend to hold in memory
            user: {
                id: user.id,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
export const logout = async (req, res) => {
    if (!req.user)
        return res.status(401).json({ success: false, message: "Unauthorized" });
    try {
        // Invalidate ALL tokens instantly by incrementing token version
        await prisma.user.update({
            where: { id: req.user.id },
            data: { tokenVersion: { increment: 1 } }
        });
        res.clearCookie("refresh_token");
        return res.json({ success: true, message: "Logged out from all sessions" });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
//# sourceMappingURL=auth.controller.js.map