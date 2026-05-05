import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { env } from "./env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME as string,
  api_key: env.CLOUDINARY_API_KEY as string,
  api_secret: env.CLOUDINARY_API_SECRET as string,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: any, file: any) => {
    return {
      folder: "nextif_proofs",
      resource_type: "auto", // Automatically detect image, video, or raw (PDF)
      allowed_formats: ["jpg", "png", "jpeg", "pdf", "mp4", "mov"],
    };
  },
});

export { cloudinary, storage };
