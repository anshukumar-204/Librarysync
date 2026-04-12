import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";

/**
 * Normalizes an Indian mobile number by removing all non-numeric characters.
 * If the number contains a country code prefix (91) and is 12 digits, it returns the last 10.
 */
export const normalizeMobile = (phone: string): string => {
  if (!phone) return "";
  
  // If it starts with +, treat as global E.164
  if (phone.startsWith("+")) {
    return "+" + phone.replace(/\D/g, "");
  }

  // Keep only digits for internal processing
  const digits = phone.replace(/\D/g, "");
  
  // If 12 digits and starts with 91, it's an Indian number with prefix
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  
  return digits;
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Real-time availability check for mobile and email
 */
const verifyRealPhone = async (phone: string): Promise<{ valid: boolean; carrier?: string; region?: string; message?: string }> => {
  const apiKey = process.env.VERIPHONE_API_KEY;
  if (!apiKey) {
    console.warn("VERIPHONE_API_KEY missing - skipping global verification");
    return { valid: true }; // Fallback to local check
  }

  try {
    // Prefix with +91 for Indian numbers (standard for this system)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const response = await fetch(`https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(formattedPhone)}&key=${apiKey}`);
    
    if (!response.ok) {
      console.error("Veriphone API Error:", response.statusText);
      return { valid: true }; // Fallback
    }

    const data = await response.json();
    return {
      valid: data.phone_valid,
      carrier: data.carrier,
      region: data.phone_region || data.country,
      message: data.phone_valid ? 'Valid Number' : 'Invalid global phone number'
    };
  } catch (error) {
    console.error("Veriphone Integration Failure:", error);
    return { valid: true }; // Fallback
  }
};

/**
 * Global Email Reputation Check (Abstract API)
 */
const verifyRealEmail = async (email: string): Promise<{ valid: boolean; provider?: string; message?: string }> => {
  const apiKey = process.env.ABSTRACT_EMAIL_API_KEY;
  if (!apiKey) {
    console.warn("ABSTRACT_EMAIL_API_KEY missing - skipping global verification");
    return { valid: true };
  }

  try {
    const response = await fetch(`https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`);
    
    if (!response.ok) {
      console.error("Abstract API Error:", response.statusText);
      return { valid: true }; // Fallback
    }

    const data = await response.json();
    
    // Deliverability checks
    const isDeliverable = data.email_deliverability?.status === 'deliverable';
    const isDisposable = data.email_quality?.is_disposable === true;
    
    if (isDisposable) {
      return { valid: false, message: "Disposable email addresses are not permitted" };
    }

    if (!isDeliverable) {
      return { 
        valid: false, 
        message: `Email is ${data.email_deliverability?.status_detail || 'undeliverable'}` 
      };
    }

    return {
      valid: true,
      provider: data.email_sender?.email_provider_name || 'Verified',
      message: 'Verified'
    };
  } catch (error) {
    console.error("Abstract Integration Failure:", error);
    return { valid: true }; // Fallback
  }
};

export const checkAvailability = async (req: Request, res: Response) => {
  try {
    const { type, value, excludeId } = req.body;

    if (!type || !value) {
      return res.status(400).json({ success: false, message: "Missing type or value for verification" });
    }

    let normalizedValue = value.trim();
    if (type === "mobile") {
      normalizedValue = normalizeMobile(value);
      // Strict 10-digit check ONLY if it's not a global + number
      if (!normalizedValue.startsWith("+") && normalizedValue.length !== 10) {
        return res.json({ 
          available: false, 
          message: "Institutional mobile must be exactly 10 digits",
          normalizedValue 
        });
      }
    } else if (type === "email") {
      if (!isValidEmail(normalizedValue)) {
        return res.json({ 
          available: false, 
          message: "Invalid access dispatch email format" 
        });
      }
    }

    // Check availability in User table
    const existingUser = await prisma.user.findFirst({
      where: {
        [type === "mobile" ? "mobile" : "email"]: normalizedValue,
        ...(excludeId && {
           student: {
             id: { not: Number(excludeId) }
           }
        })
      }
    });

    if (existingUser) {
      return res.json({
        available: false,
        message: `${type === "mobile" ? "Mobile number" : "Email address"} already exists in the registry`,
        normalizedValue
      });
    }

    // Step 3: Global Phone Validation (Veriphone)
    if (type === "mobile") {
      const globalCheck = await verifyRealPhone(normalizedValue);
      if (!globalCheck.valid) {
        return res.json({
          available: false,
          message: `${globalCheck.message}. Please check digits.`,
          normalizedValue
        });
      }

      return res.json({
        success: true,
        available: true,
        message: `${globalCheck.carrier} (${globalCheck.region}) - Verified`,
        normalizedValue,
        details: {
          carrier: globalCheck.carrier,
          region: globalCheck.region
        }
      });
    }

    // Step 3: Global Email Validation (Abstract)
    if (type === "email") {
      const emailCheck = await verifyRealEmail(normalizedValue);
      if (!emailCheck.valid) {
        return res.json({
          available: false,
          message: emailCheck.message,
          normalizedValue
        });
      }

      return res.json({
        success: true,
        available: true,
        message: `${emailCheck.provider} Account - Verified`,
        normalizedValue,
        details: {
          provider: emailCheck.provider
        }
      });
    }

    return res.json({
      success: true,
      available: true,
      message: `Available`,
      normalizedValue
    });

  } catch (error) {
    console.error("AVAILABILITY_CHECK_ERROR:", error);
    return res.status(500).json({ success: false, message: "Verification system failure" });
  }
};
