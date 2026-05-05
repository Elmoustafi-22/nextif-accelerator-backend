import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changeAmbassadorPassword,
  getAmbassadorStats,
} from "./ambassador.controller";
import { protect } from "../../middlewares/auth.middleware";
import { role } from "../../middlewares/roles.middleware";

const ambassadorRouter = Router();

// Protected Routes (All require Auth + Ambassador Role)
ambassadorRouter.use(protect);
ambassadorRouter.use(role(["AMBASSADOR"]));

// Profile
ambassadorRouter.get("/me", getProfile);
ambassadorRouter.patch("/me", updateProfile);
ambassadorRouter.patch("/change-password", changeAmbassadorPassword);

// Dashboard
ambassadorRouter.get("/dashboard/stats", getAmbassadorStats);

export default ambassadorRouter;
