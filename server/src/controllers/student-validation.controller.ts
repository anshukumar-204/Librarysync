import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";

/**
 * Normalizes an Indian mobile number by removing all non-numeric characters.
 * If the number contains a country code prefix (91) and is 12 digits, it returns the last 10.
 */
export const normalizeMobile = (phone: string): string => {
  if (!phone) return "";

  const digitsOnly = phone.replace(/\D/g, "");

  // Indian number with +91 or 91 prefix should normalize to local 10-digit form
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly.slice(2);
  }

  // Indian number with leading zero should also normalize to 10-digit form
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    return digitsOnly.slice(1);
  }

  // Preserve E.164-style international numbers for non-Indian formats
  if (phone.trim().startsWith("+")) {
    return "+" + digitsOnly;
  }

  return digitsOnly;
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const response = await fetch(`https://api.veriphone.io/v2/verify?phone=${encodeURIComponent(formattedPhone)}&key=${apiKey}`, {
      signal: controller.signal
    });
    
    if (!response.ok) {
      console.error("Veriphone API Error:", response.statusText);
      return { valid: true };
    }

    const data = await response.json() as any;
    return {
      valid: data.phone_valid,
      carrier: data.carrier,
      region: data.phone_region || data.country,
      message: data.phone_valid ? 'Valid Number' : 'Invalid global phone number'
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn("Veriphone verification timed out - proceeding with fallback");
    } else {
      console.error("Veriphone Integration Failure:", error.message);
    }
    return { valid: true };
  } finally {
    clearTimeout(timeoutId);
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

  try {
    const response = await fetch(`https://emailreputation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`, {
      signal: controller.signal
    });
    
    if (!response.ok) {
      console.error("Abstract API Error:", response.statusText);
      return { valid: true };
    }

    const data = await response.json() as any;
    
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

    const provider = data.email_sender?.email_provider_name || 
                     data.email_domain?.domain?.split('.')[0] || 
                     'Verified';

    return {
      valid: true,
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
      message: 'Verified'
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn("Abstract verification timed out - proceeding with fallback");
    } else {
      console.error("Abstract Integration Failure:", error.message);
    }
    return { valid: true };
  } finally {
    clearTimeout(timeoutId);
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

      const cleanProvider = emailCheck.provider === 'Verified' ? 'Email' : emailCheck.provider;
      
      return res.json({
        success: true,
        available: true,
        message: `${cleanProvider} Account - Verified`,
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
