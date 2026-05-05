import crypto from "crypto";

export const generateResetToken = () => {
    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
        .createHash("sha256")
        .update("rawToken")
        .digest("hex");

    return {
        rawToken,
        hashedToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    }
}