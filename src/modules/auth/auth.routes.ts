import { Router } from "express";
import {
  ambassadorFirstLoginController,
  ambassadorLoginController,
  resetAmbassadorPassword,
  adminLogin,
  requestPasswordReset,
  resetPassword,
  adminFirstLoginController,
  setupAdminPassword
} from "./auth.controller";
import { protect } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validation.middleware";
import { 
  loginSchema, 
  firstLoginSchema, 
  setupPasswordSchema 
} from "../../utils/validation.schemas";

const authRouter = Router();

// Ambassador Auth
authRouter.post(
  "/ambassador/first-login", 
  validate(firstLoginSchema), 
  ambassadorFirstLoginController
);
authRouter.post(
  "/ambassador/login", 
  validate(loginSchema), 
  ambassadorLoginController
);
authRouter.patch(
  "/ambassador/password-reset", 
  protect, 
  validate(setupPasswordSchema), 
  resetAmbassadorPassword
);

// Admin Auth
authRouter.post(
  "/admin/first-login", 
  validate(firstLoginSchema), 
  adminFirstLoginController
);
authRouter.post(
  "/admin/login", 
  validate(loginSchema), 
  adminLogin
);
authRouter.patch(
  "/admin/setup-password", 
  protect, 
  validate(setupPasswordSchema), 
  setupAdminPassword
);

// Common
authRouter.post("/password-reset-request", requestPasswordReset);
authRouter.post("/password-reset", resetPassword);

export default authRouter;