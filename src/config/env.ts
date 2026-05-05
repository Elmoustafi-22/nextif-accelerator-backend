import { config } from "dotenv";

config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),

  MONGODB_URI: process.env.MONGODB_URI,

  JWT_SECRET: process.env.JWT_SECRET || "super_secret_fallback_change_this",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",

  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS || "10", 10),
  SMTP_HOST: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL || "no-reply@nextif.com",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  ADMIN_FRONTEND_URL: process.env.ADMIN_FRONTEND_URL || "http://localhost:3000",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

if (!env.MONGODB_URI) {
  throw new Error("❌ Fatal Error: MONGODB_URI is not defined");
}

if (
  !env.CLOUDINARY_CLOUD_NAME ||
  !env.CLOUDINARY_API_KEY ||
  !env.CLOUDINARY_API_SECRET
) {
  console.warn(
    "⚠️ Warning: Cloudinary configuration is missing. File uploads will fail."
  );
}

if (
  env.JWT_SECRET === "super_secret_fallback_change_this" &&
  env.NODE_ENV === "production"
) {
  console.warn("⚠️ Warning: Using default JWT_SECRET in production!");
}
