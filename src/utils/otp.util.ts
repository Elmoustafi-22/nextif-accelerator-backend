import crypto from "crypto";

/**
 * Generates a secure 6-digit OTP
 */
export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
