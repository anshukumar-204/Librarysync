import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { generateSecureOTP, hashPassword, verifyPassword } from "../utils/security.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import nodemailer from "nodemailer";

// Mailer logic optimized for ESM environment variable loading
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (transporter) return transporter;
  
  const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error("[MAILER] Critical Error: SMTP credentials missing from environment.");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: { user, pass },
  });

  return transporter;
};

const sendMail = async (email: string, subject: string, html: string) => {
  try {
    const mailer = getTransporter();
    const fromAddress = process.env.SENDER_EMAIL || "no-reply@librync.io";
    
    await mailer.sendMail({
      from: `"Librync Hub" <${fromAddress}>`,
      to: email,
      subject,
      html,
    });
    console.log(`[MAILER] Successfully dispatched email to: ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[MAILER] Dispatch Failure to: ${email}`);
    console.error(`[MAILER] Error Code: ${error.code}`);
    console.error(`[MAILER] Error Message: ${error.message}`);
    return { success: false, error };
  }
};

export const login = async (req: Request, res: Response) => {
  const { credential, password } = req.body; // credential can be email or mobile
  if (!credential || !password) return res.status(400).json({ success: false, message: "Missing credentials" });

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: credential },
          { mobile: credential }
        ]
      }
    });

    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // Check brute force
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ success: false, message: "Account temporarily locked. Please try again later." });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      const attempts = user.failedLoginAttempts + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
      const attemptsLeft = Math.max(0, 5 - attempts);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: attempts, lockedUntil }
      });

      const message = attempts >= 5 
        ? "Account temporarily locked for 15 minutes due to too many failed attempts."
        : `Invalid credentials. Attempts left: ${attemptsLeft}`;

      return res.status(401).json({ 
        success: false, 
        message,
        attemptsLeft 
      });
    }

    // Success! Reset attempts
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null }
    });

    // If Admin, trigger 2FA (this is what the user meant by "admin email verification login")
    if (user.role === "admin") {
      const otp = generateSecureOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verifyOtp: otp,
          verifyOtpExpiresAt: expiresAt
        }
      });

      if (user.email) {
        const mailSent = await sendMail(
          user.email,
          "Admin Access Security Code",
          `
          <div style="font-family: sans-serif; padding: 20px; color: #333; background: #fafafa;">
            <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb;">
              <h2 style="color: #ef4444; margin-bottom: 24px;">Security Verification Required</h2>
              <p>An administrative login was initiated. Use the following code to authorize this session.</p>
              <div style="background: #fef2f2; padding: 24px; border-radius: 12px; text-align: center; margin: 32px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #b91c1c;">${otp}</span>
              </div>
              <p style="font-size: 14px; color: #6b7280;">If you did not attempt to login, please change your password immediately.</p>
            </div>
          </div>
          `
        );

        if (!mailSent.success) {
          return res.status(500).json({ success: false, message: "Failed to dispatch security code. Please check mailer nodes." });
        }

        return res.json({
          success: true,
          requiresOtp: true,
          message: "Security code dispatched to registered admin email.",
          loginId: user.id
        });
      } else {
         return res.status(400).json({ success: false, message: "Admin account has no verified email node. Contact system architect." });
      }
    }

    // Standard Student Login Flow
    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, tokenVersion: user.tokenVersion });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Access granted",
      accessToken,
      user: { id: user.id, name: user.name, role: user.role, email: user.email }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Authentication failure" });
  }
};

export const verifyLoginOtp = async (req: Request, res: Response) => {
  const { loginId, otp } = req.body;
  if (!loginId || !otp) return res.status(400).json({ success: false, message: "Identification and Security Code required" });

  try {
    const user = await prisma.user.findUnique({ where: { id: Number(loginId) } });
    
    if (!user || user.verifyOtp !== otp || !user.verifyOtpExpiresAt || user.verifyOtpExpiresAt < new Date()) {
      return res.status(401).json({ success: false, message: "Invalid or expired security code" });
    }

    // OTP Verified! Reset security nodes and issue tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verifyOtp: null,
        verifyOtpExpiresAt: null,
        lastLoginAt: new Date()
      }
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, tokenVersion: user.tokenVersion });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Identity verified. Node access authorized.",
      accessToken,
      user: { id: user.id, name: user.name, role: user.role, email: user.email }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Registry Authorization Failure" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user doesn't exist to prevent enumeration
      return res.json({ success: true, message: "If an account exists, an OTP has been sent." });
    }

    const otp = generateSecureOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpiresAt: expiresAt
      }
    });

    await sendMail(
      email,
      "Password Reset Registry OTP",
      `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #10b981;">Registry Security Protocol</h2>
        <p>A password reset was requested for your Librync account.</p>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #71717a;">This code expires in 15 minutes. If you did not request this, please secure your nodes immediately.</p>
      </div>
      `
    );

    return res.json({ success: true, message: "Reset OTP sent successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Communication failure" });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: "Missing reset nodes" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.resetOtp !== otp || !user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date()) {
      return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetOtp: null,
        resetOtpExpiresAt: null,
        tokenVersion: { increment: 1 } // Invalidate all existing sessions
      }
    });

    return res.json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Registry Update Failure" });
  }
};

const maskEmail = (email: string | null) => {
  if (!email) return "N/A";
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (!name || !domain) return email;
  return `${name[0]}****${name[name.length - 1]}@${domain}`;
};

const maskMobile = (mobile: string) => {
  if (!mobile) return "";
  return mobile.slice(0, 2) + "******" + mobile.slice(-2);
};

export const verifyRegistration = async (req: Request, res: Response) => {
  const { credential } = req.body; // mobile or email
  if (!credential) return res.status(400).json({ success: false, message: "Identification node required" });

  try {
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          { role: "student" },
          { OR: [{ mobile: credential }, { email: credential }] }
        ]
      },
      include: { student: true }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Identity not found in institute registry. Please contact administration." 
      });
    }

    return res.json({
      success: true,
      message: "Identity found",
      data: {
        fullName: user.name,
        // Mobile is always there as its the primary ID, we mask it
        mobile: maskMobile(user.mobile),
        // If email is missing, return empty string so frontend can enable editing
        email: user.email ? maskEmail(user.email) : "",
        student: {
          ...user.student,
          // Mask fatherName only if it exists
          fatherName: user.student?.fatherName ? maskMobile(user.student.fatherName).replace("@", "") : "",
          // Return other fields as is (they will be empty strings if null in DB)
          address: user.student?.address || "",
          village: user.student?.village || "",
          post: user.student?.post || "",
          district: user.student?.district || "",
          city: user.student?.city || "",
          state: user.student?.state || "",
          pincode: user.student?.pincode || "",
        }
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Registry Inquiry Failure" });
  }
};

export const register = async (req: Request, res: Response) => {
  console.log("[REGISTRY] Initializing zero-latency portal activation...");
  try {
    const { 
      credential, password, email, fullName, profileImage, fatherName, address, 
      village, post, district, city, state, pincode 
    } = req.body;

    if (!credential || !password) {
      return res.status(400).json({ success: false, message: "Credential and Password node required" });
    }

    // Search for existing registry entry using the original credential
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { role: "student" },
          { OR: [{ mobile: credential }, { email: credential }] }
        ]
      },
      include: { student: true }
    });

    if (!existingUser) {
      console.warn("[REGISTRY] Identity node not found.");
      return res.status(404).json({ success: false, message: "Institute Registry node missing. Contact Admin." });
    }

    // Determine target email for activation
    const targetEmail = email || existingUser.email;
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: "Activation requires an email node. Please provide one." });
    }

    console.log("[REGISTRY] Synchronizing profile components...");
    const passwordHash = await hashPassword(password);
    const otp = generateSecureOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // TRANSACTIONAL UPDATE: Sync security nodes AND profile data
    // MANDATORY VALIDATION: All nodes must be complete at this stage
    if (!fullName || !fatherName || !address || !village || !post || !district || !city || !state || !pincode) {
      // Check if we already have them in DB or if they are being provided now
      const isMissing = (val: string | null | undefined, provided: string | null | undefined) => (!val || val === "New Student") && !provided;
      
      if (
        isMissing(existingUser.student?.fullName, fullName) ||
        isMissing(existingUser.student?.fatherName, fatherName) ||
        isMissing(existingUser.student?.address, address) ||
        isMissing(existingUser.student?.village, village) ||
        isMissing(existingUser.student?.post, post) ||
        isMissing(existingUser.student?.district, district) ||
        isMissing(existingUser.student?.city, city) ||
        isMissing(existingUser.student?.state, state) ||
        isMissing(existingUser.student?.pincode, pincode)
      ) {
        return res.status(400).json({ success: false, message: "Portal activation requires a complete profile. Please fill all missing nodes." });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        verifyOtp: otp,
        verifyOtpExpiresAt: expiresAt,
        // Update name if student provided a real one
        ...(fullName && fullName !== "New Student" && { name: fullName }),
        // Update email only if student provided a new one
        ...(email && { email }),
        student: {
          update: {
            // Update profile image if provided
            ...(profileImage && { profileImage }),
            // Update address nodes if provided
            ...(fullName && fullName !== "New Student" && { fullName }),
            ...(fatherName && { fatherName }),
            ...(address && { address }),
            ...(village && { village }),
            ...(post && { post }),
            ...(district && { district }),
            ...(city && { city }),
            ...(state && { state }),
            ...(pincode && { pincode }),
          }
        }
      }
    });

    // Send Activation Email (AWAITED DISPATCH)
    console.log(`[REGISTRY] Dispatching activation cipher to: ${targetEmail}`);
    const mailSent = await sendMail(
      targetEmail,
      "Hub Activation Cipher",
      `
      <div style="font-family: sans-serif; padding: 20px; color: #333; background: #fafafa;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb;">
          <h2 style="color: #2563eb; margin-bottom: 24px;">Activate Your Portal Access</h2>
          <p>Please use the following 6-digit cipher to finalize your Librync Student Portal registration.</p>
          <div style="background: #eff6ff; padding: 24px; border-radius: 12px; text-align: center; margin: 32px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #1e40af;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #6b7280; border-top: 1px solid #f3f4f6; pt: 20px; mt: 24px;">
            This token expires in 15 minutes. If you did not initiate this activation, ignore this email.
          </p>
        </div>
      </div>
      `
    );

    if (!mailSent.success) {
      console.error("[REGISTRY] Email dispatch failure. Reverting security update...");
      // Optional: Revert OTP update if email fails
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { verifyOtp: null, verifyOtpExpiresAt: null }
      });
      return res.status(500).json({ success: false, message: "Failed to dispatch activation cipher. Please check mailer settings." });
    }

    console.log("[REGISTRY] Response dispatched. Portal activating.");
    return res.status(200).json({
      success: true,
      pendingVerification: true,
      message: "Activation cipher sent to registered email."
    });

  } catch (error) {
    console.error("[REGISTRY CRITICAL] Activation Failure:", error);
    return res.status(500).json({ success: false, message: "Failed to initiate portal activation" });
  }
};

export const completeRegistration = async (req: Request, res: Response) => {
  const { credential, otp } = req.body;
  if (!credential || !otp) return res.status(400).json({ success: false, message: "Identification and Cipher required" });

  try {
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          { role: "student" },
          { OR: [{ mobile: credential }, { email: credential }] }
        ]
      }
    });

    if (!user || user.verifyOtp !== otp || !user.verifyOtpExpiresAt || user.verifyOtpExpiresAt < new Date()) {
      return res.status(401).json({ success: false, message: "Invalid or expired activation cipher" });
    }

    // Finalize Activation
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyOtp: null,
        verifyOtpExpiresAt: null,
        status: "active"
      }
    });

    // Issue tokens
    const accessToken = generateAccessToken({ id: updatedUser.id, role: updatedUser.role });
    const refreshToken = generateRefreshToken({ id: updatedUser.id, tokenVersion: updatedUser.tokenVersion });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Portal account successfully activated",
      accessToken,
      user: { id: updatedUser.id, name: updatedUser.name, role: updatedUser.role, email: updatedUser.email }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to finalize activation" });
  }
};

export const logout = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { tokenVersion: { increment: 1 } }
    });

    res.clearCookie("refresh_token");
    return res.json({ success: true, message: "Logged out from all sessions" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
