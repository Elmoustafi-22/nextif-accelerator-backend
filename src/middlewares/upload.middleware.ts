import multer from "multer";
import { storage } from "../config/cloudinary.config";

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit to accommodate videos
  },
});

export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for CSVs
  },
});
