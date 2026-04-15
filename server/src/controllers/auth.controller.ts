import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { generateSecureOTP, hashPassword, verifyPassword } from "../utils/security.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { sendMail } from "../utils/mailer.js";
import { normalizeMobile } from "./student-validation.controller.js";
import admin from "../config/firebase-admin.js";
import { recordSession } from "../services/session.service.js";

export const login = async (req: Request, res: Response) => {
  const { credential, password } = req.body; // credential can be email or mobile
  if (!credential || !password) return res.status(400).json({ success: false, message: "Please provide both your identification and password." });

  const searchCredential = String(credential).trim();
  const normalizedMobile = normalizeMobile(searchCredential);

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: searchCredential, mode: "insensitive" } },
          { mobile: normalizedMobile },
          { mobile: searchCredential }
        ]
      }
    });

    if (!user) return res.status(401).json({ success: false, message: "Incorrect identification or password. Please try again." });

    // Check brute force
    if (user.lockedUntil) {
      const lockTimeRemaining = user.lockedUntil.getTime() - Date.now();
      if (lockTimeRemaining > 0) {
        const minutesWaiting = Math.ceil(lockTimeRemaining / (1000 * 60));
        return res.status(403).json({ 
          success: false, 
          message: `Account temporarily locked due to multiple failed attempts. Please try again in ${minutesWaiting} minute${minutesWaiting > 1 ? 's' : ''}.` 
        });
      }
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
        ? "Account temporarily locked for 15 minutes due to multiple failed attempts. Please try again later."
        : `Incorrect credentials. Attempts remaining: ${attemptsLeft}`;

      return res.status(401).json({
        success: false,
        message,
        attemptsLeft,
        lockDuration: attempts >= 5 ? 15 : 0
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
          return res.status(500).json({
            success: false,
            message: "Internal Security Error: Unable to send verification email. Please contact the administrator.",
            details: (mailSent.error as any)?.message || "SMTP Dispatch Failure",
            code: (mailSent.error as any)?.code || "MAIL_ERR"
          });
        }

        return res.json({
          success: true,
          requiresOtp: true,
          message: "A secure verification code has been sent to your registered admin email.",
          loginId: user.id
        });
      } else {
        return res.status(400).json({ success: false, message: "This admin account does not have a registered email. Please contact technical support." });
      }
    }

    // Standard Student Login Flow
    // Create record session
    const session = await recordSession(user.id, {
      userAgent: req.headers["user-agent"] || "",
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "",
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role, tokenVersion: user.tokenVersion });
    const refreshToken = generateRefreshToken({ id: user.id, tokenVersion: user.tokenVersion });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Authentication successful. Access granted.",
      accessToken,
      sessionId: session.id,
      user: { id: user.id, name: user.name, role: user.role, email: user.email, status: user.status }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "An error occurred during authentication. Please try again." });
  }
};

export const verifyLoginOtp = async (req: Request, res: Response) => {
  const { loginId, otp } = req.body;
  if (!loginId || !otp) return res.status(400).json({ success: false, message: "Identification and verification code are required." });

  try {
    const user = await prisma.user.findUnique({ where: { id: Number(loginId) } });

    if (!user || user.verifyOtp !== otp || !user.verifyOtpExpiresAt || user.verifyOtpExpiresAt < new Date()) {
      return res.status(401).json({ success: false, message: "The verification code provided is invalid or has expired." });
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

    const session = await recordSession(user.id, {
      userAgent: req.headers["user-agent"] || "",
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "",
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role, tokenVersion: user.tokenVersion });
    const refreshToken = generateRefreshToken({ id: user.id, tokenVersion: user.tokenVersion });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Welcome back! Your identity has been verified.",
      accessToken,
      sessionId: session.id,
      user: { id: user.id, name: user.name, role: user.role, email: user.email, status: user.status }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Secure authorization failed. Please try logging in again." });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this email address. Please check and try again." });
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
    return res.status(500).json({ success: false, message: "Internal communication failure while sending email." });
  }
};

export const checkAccountExistence = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email is required for verification." });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({
        exists: false,
        message: "Registry Desync: This email address is not registered in our current student or administrator database."
      });
    }

    return res.json({
      exists: true,
      message: `Identity Sync Successful: We found a ${user.role} account registered to ${user.name}.`,
      name: user.name,
      role: user.role
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Registry check failed." });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: "Required reset info is missing." });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.resetOtp !== otp || !user.resetOtpExpiresAt || user.resetOtpExpiresAt < new Date()) {
      return res.status(401).json({ success: false, message: "Invalid or expired reset code." });
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
    return res.status(500).json({ success: false, message: "Unable to update account information. Please try again." });
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
  if (!credential) return res.status(400).json({ success: false, message: "Identification is required to proceed." });

  const searchCredential = String(credential).trim();
  const normalizedMobile = normalizeMobile(searchCredential);

  try {
    const user = await prisma.user.findFirst({
      where: {
        role: "student",
        OR: [
          { mobile: searchCredential },
          { mobile: normalizedMobile },
          { email: { equals: searchCredential, mode: "insensitive" } }
        ]
      },
      include: { student: true }
    });

    if (!user) {
      // DEBUG: Check if user exists at all with different role or status
      const globalUser = await prisma.user.findFirst({
        where: {
          OR: [
            { mobile: searchCredential },
            { mobile: normalizedMobile },
            { email: { equals: searchCredential, mode: "insensitive" } }
          ]
        }
      });

      if (globalUser) {
        if (globalUser.role !== "student") {
          return res.status(403).json({
            success: false,
            message: `Account Found: This ${globalUser.role} account is not eligible for student self-registration.`
          });
        }
      }

      return res.status(404).json({
        success: false,
        message: "Registry Desync: No student record matches this identification. Please check for typos or contact the administration."
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "This student portal is already fully activated. Please proceed to the login page."
      });
    }

    return res.json({
      success: true,
      message: "Identity found in institutional registry.",
      data: {
        fullName: maskMobile(user.name).replace("@", ""),
        // Mobile is the primary ID, we mask it for privacy
        mobile: maskMobile(user.mobile),
        // Email is masked unless missing
        email: user.email ? maskEmail(user.email) : "",
        student: {
          ...user.student,
          // Mask fatherName as requested for privacy
          fatherName: user.student?.fatherName ? maskMobile(user.student.fatherName).replace("@", "") : "",
          // Return other fields as is
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
    return res.status(500).json({ success: false, message: "Unable to find record in the institutional registry." });
  }
};

export const register = async (req: Request, res: Response) => {
  console.log("[REGISTRY] Initializing zero-latency portal activation...");
  try {
    const {
      credential, password, email, fullName, profileImage, fatherName, address,
      village, post, district, city, state, pincode
    } = req.body;

    const isMasked = (val: string | null | undefined) => val && val.includes("****");

    if (!credential || !password) {
      return res.status(400).json({ success: false, message: "Identification and password are required for activation." });
    }

    const searchCredential = String(credential).trim();
    const normalizedMobile = normalizeMobile(searchCredential);

    // Stage 1: Absolute Robust Search (Standard)
    let existingUser = await prisma.user.findFirst({
      where: {
        role: "student",
        OR: [
          { mobile: searchCredential },
          { mobile: normalizedMobile },
          { email: { equals: searchCredential, mode: "insensitive" } }
        ]
      },
      include: { student: true }
    });

    // Stage 2: Super Search Fallback (Handles any formatting discrepancies)
    if (!existingUser) {
      existingUser = await prisma.user.findFirst({
        where: {
          role: "student",
          OR: [
            { mobile: { contains: searchCredential } },
            { email: { contains: searchCredential, mode: "insensitive" } }
          ]
        },
        include: { student: true }
      });
    }

    if (!existingUser) {
      console.warn("[REGISTRY] Identity node not found during activation.");
      return res.status(404).json({ success: false, message: "Student record not found in the institute registry. Please register at the admin office." });
    }

    if (existingUser.emailVerified) {
      return res.status(400).json({ success: false, message: "This student portal is already active." });
    }

    // Determine target email for activation (MUST NOT BE MASKED)
    const targetEmail = (email && !isMasked(email)) ? email : existingUser.email;
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: "Account activation requires a valid email address for secure verification. Please provide your email." });
    }

    // --- COOLDOWN CHECK (60s) ---
    // If OTP was sent less than 60 seconds ago, don't resend
    if (existingUser.verifyOtpExpiresAt) {
      const timeSinceSent = 15 * 60 * 1000 - (existingUser.verifyOtpExpiresAt.getTime() - Date.now());
      if (timeSinceSent < 60000) {
        return res.status(200).json({
          success: true,
          pendingVerification: true,
          message: "Activation code already dispatched. Please check your inbox (including spam)."
        });
      }
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
        return res.status(400).json({ success: false, message: "Activation Failed: Please ensure all required profile information is filled." });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        verifyOtp: otp,
        verifyOtpExpiresAt: expiresAt,
        // Update name if student provided a real one and it wasn't masked
        ...(fullName && fullName !== "New Student" && !isMasked(fullName) && { name: fullName }),
        // Update email only if student provided a new one and it wasn't masked
        ...(email && !isMasked(email) && { email }),
        student: {
          update: {
            // Update profile image if provided
            ...(profileImage && { profileImage }),
            // Update address nodes if provided AND NOT MASKED
            ...(fullName && fullName !== "New Student" && !isMasked(fullName) && { fullName }),
            ...(fatherName && !isMasked(fatherName) && { fatherName }),
            ...(address && !isMasked(address) && { address }),
            ...(village && !isMasked(village) && { village }),
            ...(post && !isMasked(post) && { post }),
            ...(district && !isMasked(district) && { district }),
            ...(city && !isMasked(city) && { city }),
            ...(state && !isMasked(state) && { state }),
            ...(pincode && !isMasked(pincode) && { pincode }),
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
      const isAuthErr = (mailSent.error as any)?.code === "unauthorized" || (mailSent.error as any)?.message?.includes("Key not found");

      return res.status(500).json({
        success: false,
        message: isAuthErr
          ? "System Configuration Error: The mailer API key (SMTP_PASS) in the .env file is invalid or unauthorized."
          : "Unable to send activation email. Please check your email address or contact support.",
        details: (mailSent.error as any)?.message || "Email Dispatch Failure",
        code: (mailSent.error as any)?.code || "MAIL_ERR"
      });
    }

    console.log(`[REGISTRY] Response dispatched. Portal activating. Brevo MessageID: ${mailSent.messageId}`);
    return res.status(200).json({
      success: true,
      pendingVerification: true,
      message: "A secure activation code has been sent to your email address."
    });

  } catch (error) {
    console.error("[REGISTRY CRITICAL] Activation Failure:", error);
    return res.status(500).json({ success: false, message: "An error occurred during portal activation initiation." });
  }
};

export const completeRegistration = async (req: Request, res: Response) => {
  const { credential, otp } = req.body;
  if (!credential || !otp) return res.status(400).json({ success: false, message: "Identification and verification code are required." });

  const searchCredential = String(credential).trim();
  const normalizedMobile = normalizeMobile(searchCredential);

  try {
    const user = await prisma.user.findFirst({
      where: {
        role: "student",
        OR: [
          { mobile: searchCredential },
          { mobile: normalizedMobile },
          { email: { equals: searchCredential, mode: "insensitive" } }
        ]
      }
    });

    if (!user || user.verifyOtp !== otp || !user.verifyOtpExpiresAt || user.verifyOtpExpiresAt < new Date()) {
      return res.status(401).json({ success: false, message: "The activation code provided is invalid or has expired." });
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

    const session = await recordSession(updatedUser.id, {
      userAgent: req.headers["user-agent"] || "",
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "",
    });

    // Issue tokens
    const accessToken = generateAccessToken({ id: updatedUser.id, role: updatedUser.role, tokenVersion: updatedUser.tokenVersion });
    const refreshToken = generateRefreshToken({ id: updatedUser.id, tokenVersion: updatedUser.tokenVersion });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Your student portal account has been successfully activated. Welcome!",
      accessToken,
      sessionId: session.id,
      user: { id: updatedUser.id, name: updatedUser.name, role: updatedUser.role, email: updatedUser.email, status: updatedUser.status }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "An error occurred while finalizing your account activation." });
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

export const mailerHealthCheck = async (req: Request, res: Response) => {
  const apiKey = process.env.SMTP_PASS ? "***SET***" : "***MISSING***";
  const sender = process.env.SENDER_EMAIL;

  const results = {
    mode: "REST_API (Port 443)",
    env: {
      BREVO_API_KEY: apiKey,
      SENDER_EMAIL: sender ? "***SET***" : "***MISSING***"
    },
    apiTest: "Pending"
  };

  try {
    if (!process.env.SMTP_PASS) throw new Error("API Key missing (SMTP_PASS)");

    // Testing connectivity with the Account endpoint (validates API key)
    const response = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": process.env.SMTP_PASS }
    });

    if (response.ok) {
      const accountData: any = await response.json();
      results.apiTest = `SUCCESS: Brevo API is reachable. Account for: ${accountData.email}`;
      return res.json({ success: true, ...results, account: { email: accountData.email, plan: accountData.planType } });
    } else {
      const data: any = await response.json();
      throw new Error(data.message || "API Authorization Failed");
    }
  } catch (error: any) {
    results.apiTest = `FAILED: ${error.message}`;
    return res.status(500).json({ success: false, ...results, error_code: error.code });
  }
};

export const firebaseSync = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ success: false, message: "No verification token provided. Please complete the Firebase authentication step first." });
  }

  try {
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (tokenError: any) {
      const isExpired = tokenError?.code === "auth/id-token-expired";
      return res.status(401).json({
        success: false,
        message: isExpired
          ? "Your session has expired. Please sign in again."
          : "Invalid security token. Please restart the authentication process.",
        code: tokenError?.code || "TOKEN_INVALID"
      });
    }

    const { email, phone_number } = decodedToken;

    if (!email && !phone_number) {
      return res.status(400).json({
        success: false,
        message: "Firebase token does not contain a verifiable email or phone. Please use a different sign-in method."
      });
    }

    let user;
    if (email) {
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        include: { student: true }
      });
    } else if (phone_number) {
      const normalized = normalizeMobile(phone_number);
      user = await prisma.user.findFirst({
        where: { OR: [{ mobile: phone_number }, { mobile: normalized }] },
        include: { student: true }
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: email
          ? `No student record found for email: ${email}. Please ensure your account was registered by the admin with this exact email.`
          : `No student record found for this mobile number. Please ensure your profile mobile matches the institute database.`,
        code: "RECORD_NOT_FOUND"
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (1000 * 60));
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed attempts. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`
      });
    }

    // Auto-activate account on successful Firebase verification (email/phone is proven valid)
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, status: "active", failedLoginAttempts: 0, lockedUntil: null }
      });
    }

    const session = await recordSession(user.id, {
      userAgent: req.headers["user-agent"] || "",
      ipAddress: (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "",
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role, tokenVersion: user.tokenVersion });
    const refreshToken = generateRefreshToken({ id: user.id, tokenVersion: user.tokenVersion });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(`[FIREBASE SYNC] Successfully authenticated UserID ${user.id} (${user.role}) via Firebase.`);

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}! You have been securely logged in.`,
      accessToken,
      sessionId: session.id,
      user: { id: user.id, name: user.name, role: user.role, email: user.email, status: user.status }
    });

  } catch (error: any) {
    console.error("FIREBASE SYNC CRITICAL ERROR:", error);
    return res.status(500).json({ success: false, message: "An unexpected server error occurred during authentication. Please try again." });
  }
};
