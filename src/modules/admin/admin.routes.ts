import { Router } from "express";
import { protect } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/roles.middleware";
import { upload, csvUpload } from "../../middlewares/upload.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { createAmbassadorSchema } from "../../utils/validation.schemas";
import {
  getAdminProfile,
  updateAdminProfile,
  getAllAmbassadors,
  createAmbassador,
  getAmbassadorById,
  updateAmbassadorStatus,
  updateAmbassador,
  bulkOnboardAmbassadors,
  sendMessage,
  sendAnnouncement,
  forceResetAmbassadorPassword,
  getDashboardStats,
  changeAdminPassword,
  deleteAmbassador,
  getAllAdmins,
  getAdminById,
  sendAdminMessage,
} from "./admin.controller";

const adminRouter = Router();

// Protect all routes with Auth and Admin Role
adminRouter.use(protect);
adminRouter.use(role(["ADMIN"]));

// Admin Profile
adminRouter.get("/me", getAdminProfile);
adminRouter.patch("/me", updateAdminProfile);
adminRouter.patch("/change-password", changeAdminPassword);

// Dashboard Stats
adminRouter.get("/stats", getDashboardStats);

// Messaging / Announcements
adminRouter.post("/messages", sendMessage); // To Ambassador
adminRouter.post("/announcements", sendAnnouncement);

// Admin Directory & Internal Messaging
adminRouter.get("/list", getAllAdmins); // /api/v1/admin/list
adminRouter.get("/list/:id", getAdminById);
adminRouter.post("/internal-messages", sendAdminMessage);

// Ambassador Management (Admin View)
adminRouter.post(
  "/ambassadors/bulk",
  csvUpload.single("file"),
  bulkOnboardAmbassadors
); // Bulk Import
adminRouter.get("/ambassadors", getAllAmbassadors);
adminRouter.post(
  "/ambassadors",
  validate(createAmbassadorSchema),
  createAmbassador
);
adminRouter.get("/ambassadors/:id", getAmbassadorById);
adminRouter.patch("/ambassadors/:id", updateAmbassador);
adminRouter.patch("/ambassadors/:id/status", updateAmbassadorStatus);
adminRouter.post("/ambassadors/:id/force-reset", forceResetAmbassadorPassword);
adminRouter.delete("/ambassadors/:id", deleteAmbassador);

export default adminRouter;
