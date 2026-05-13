import { Request, Response } from "express";
import { generateResetToken } from "../../utils/resetToken";
import Ambassador, { IAmbassador } from "../ambassador/ambassador.model";
import Admin, { IAdmin } from "../admin/admin.model";
import { generateToken } from "../../utils/jwt";
import { comparePassword, hashPassword } from "../../utils/password";
import { Model } from "mongoose";
import crypto from "crypto";
import { EmailService } from "../../utils/email.service";
import { generateOtp } from "../../utils/otp.util";

/**
 * AMBASSADOR FIRST LOGIN
 */

export const ambassadorFirstLoginController = async (
  req: Request,
  res: Response
) => {
  const { email, lastName } = req.body;

  const ambassador = await Ambassador.findOne({
    email: email.trim().toLowerCase(),
  });

  if (!ambassador) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  if (ambassador.accountStatus === "SUSPENDED") {
    return res.status(403).json({
      message: "Account suspended",
    });
  }

  if (ambassador.passwordSet) {
    return res.status(400).json({
      message: "Password already set. Please login normally",
    });
  }

  if (ambassador.lastName.trim().toLowerCase() !== lastName.trim().toLowerCase()) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  ambassador.accountStatus = "PASSWORD_PENDING";
  await ambassador.save();

  const tempToken = generateToken({
    id: ambassador._id.toString(),
    role: "AMBASSADOR",
  });

  return res.json({
    requiresPasswordReset: true,
    token: tempToken,
    user: {
      id: ambassador._id.toString(),
      email: ambassador.email,
      role: "ambassador",
      firstName: ambassador.firstName,
      lastName: ambassador.lastName,
      profile: ambassador.profile,
      isFirstLogin: true,
    },
  });
};

export const ambassadorLoginController = async (
  req: Request,
  res: Response
) => {
  const { email, password } = req.body;

  const ambassador = await Ambassador.findOne({
    email: email.trim().toLowerCase(),
  }).select("+password");

  if (!ambassador) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  if (ambassador.accountStatus === "SUSPENDED") {
    return res.status(403).json({
      message: "Account suspended",
    });
  }

  if (!ambassador.passwordSet) {
    return res.status(400).json({
      message:
        "Password not set. Use first login (your email and lastname as password)",
    });
  }

  const isMatch = await comparePassword(
    password,
    ambassador.password as string
  );

  if (!isMatch) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  const token = generateToken({
    id: ambassador._id.toString(),
    role: "AMBASSADOR",
  });

  return res.json({
    token,
    user: {
      id: ambassador._id.toString(),
      email: ambassador.email,
      role: "ambassador",
      firstName: ambassador.firstName,
      lastName: ambassador.lastName,
      profile: ambassador.profile,
      isFirstLogin: !ambassador.passwordSet,
    },
  });
};

export const resetAmbassadorPassword = async (req: Request, res: Response) => {
  const { password } = req.body;
  const user = req.user;

  if (!user || user.role !== "AMBASSADOR") {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const ambassador = await Ambassador.findById(user.id).select("+password");

  if (!ambassador) {
    return res.status(404).json({
      message: "Account not found",
    });
  }

  const hashedPassword = await hashPassword(password);

  ambassador.password = hashedPassword;
  ambassador.passwordSet = true;
  ambassador.accountStatus = "ACTIVE";

  await ambassador.save();

  const token = generateToken({
    id: ambassador._id.toString(),
    role: "AMBASSADOR",
  });

  res.json({
    message: "Password set successfully",
    token,
    user: {
      id: ambassador._id.toString(),
      email: ambassador.email,
      role: "ambassador",
      firstName: ambassador.firstName,
      lastName: ambassador.lastName,
      profile: ambassador.profile,
      isFirstLogin: false,
    },
  });
};

export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({
    email: email.trim().toLowerCase(),
  }).select("+password");

  if (!admin) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  // Check if password is set
  if (!admin.passwordSet) {
    return res.status(400).json({
      message: "Password not set. Please use first-time login.",
    });
  }

  const isMatch = await comparePassword(password, admin.password);

  if (!isMatch) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  const token = generateToken({
    id: admin._id.toString(),
    role: "ADMIN",
  });

  res.json({
    token,
    user: {
      id: admin._id.toString(),
      email: admin.email,
      role: "admin",
      firstName: admin.firstName,
      lastName: admin.lastName,
      title: admin.title,
      avatar: admin.avatar,
      isFirstLogin: !admin.passwordSet,
    },
  });
};

/**
 * ADMIN FIRST LOGIN
 */
export const adminFirstLoginController = async (
  req: Request,
  res: Response
) => {
  const { email, lastName } = req.body;

  const admin = await Admin.findOne({ email: email.trim().toLowerCase() });

  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (admin.accountStatus === "SUSPENDED") {
    return res.status(403).json({ message: "Account suspended" });
  }

  if (admin.passwordSet) {
    return res
      .status(400)
      .json({ message: "Password already set. Please login normally." });
  }

  // Check last name
  if (admin.lastName.trim().toLowerCase() !== lastName.trim().toLowerCase()) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate temp token
  const tempToken = generateToken({
    id: admin._id.toString(),
    role: "ADMIN",
  });

  res.json({
    requiresPasswordReset: true,
    token: tempToken,
    user: {
      id: admin._id.toString(),
      email: admin.email,
      role: "admin",
      firstName: admin.firstName,
      lastName: admin.lastName,
      title: admin.title,
      avatar: admin.avatar,
      isFirstLogin: true,
    },
  });
};

export const setupAdminPassword = async (req: Request, res: Response) => {
  const { password, firstName, title } = req.body;
  const user = req.user; // Attached by protect middleware

  if (!user || user.role !== "ADMIN") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const admin = await Admin.findById(user.id).select("+password");
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  if (admin.passwordSet) {
    return res.status(400).json({ message: "Password already set" });
  }

  const hashedPassword = await hashPassword(password);
  admin.password = hashedPassword;
  admin.passwordSet = true;
  admin.accountStatus = "ACTIVE";
  if (firstName) admin.firstName = firstName;
  if (title) admin.title = title;

  await admin.save();

  const token = generateToken({
    id: admin._id.toString(),
    role: "ADMIN",
  });

  res.json({
    message: "Password set successfully",
    token,
    user: {
      id: admin._id.toString(),
      email: admin.email,
      role: "admin",
      firstName: admin.firstName,
      lastName: admin.lastName,
      title: admin.title,
      avatar: admin.avatar,
      isFirstLogin: false,
    },
  });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email, role } = req.body;

  const Model = (role === "ADMIN" ? Admin : Ambassador) as Model<
    IAdmin | IAmbassador
  >;

  const user = await Model.findOne({
    email: email.trim().toLowerCase(),
  });

  if (!user) {
    return res.json({
      message: "If the email exists, a verification code will be sent",
    });
  }

  const otp = generateOtp();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  user.otp = hashedOtp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await user.save();

  try {
    await EmailService.sendOtpEmail(user.email, user.firstName, otp);
    res.json({
      message: "Verification code sent to your email",
    });
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    res.status(500).json({
      message: "Failed to send verification code. Please try again later.",
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp, role } = req.body;

  const Model = (role === "ADMIN" ? Admin : Ambassador) as Model<
    IAdmin | IAmbassador
  >;

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await Model.findOne({
    email: email.trim().toLowerCase(),
    otp: hashedOtp,
    otpExpires: { $gt: new Date() },
  }).select("+otp");

  if (!user) {
    return res.status(400).json({
      message: "Invalid or expired verification code",
    });
  }

  const { rawToken, hashedToken, expiresAt } = generateResetToken();

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = expiresAt;
  user.otp = undefined;
  user.otpExpires = undefined;

  await user.save();

  res.json({
    message: "OTP verified successfully",
    resetToken: rawToken,
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password, role } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const Model = (role === "ADMIN" ? Admin : Ambassador) as Model<
    IAdmin | IAmbassador
  >;

  const user = await Model.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select("+password");

  if (!user) {
    return res.status(400).json({
      message: "Invalid or expired token",
    });
  }

  user.password = await hashPassword(password);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.accountStatus = "ACTIVE";
  if (role === "AMBASSADOR") {
    (user as IAmbassador).passwordSet = true;
  }

  await user.save();

  res.json({
    message: "Password reset successful",
  });
};
