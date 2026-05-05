import { Schema, model, Types } from "mongoose";

export interface IAmbassador {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: "AMBASSADOR";
  passwordSet: boolean;
  accountStatus: "PRELOADED" | "PASSWORD_PENDING" | "ACTIVE" | "SUSPENDED";
  passwordResetToken?: string | undefined;
  passwordResetExpires?: Date | undefined;
  profile: {
    phone?: string | undefined;
    avatar?: string | undefined;
    institution?: string | undefined;
    courseOfStudy?: string | undefined;
    instagram?: string | undefined;
    twitter?: string | undefined;
    linkedin?: string | undefined;
    facebook?: string | undefined;
  };
  createdAt: Date;
}

const ambassadorSchema = new Schema<IAmbassador>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, select: false },
    role: { type: String, enum: ["AMBASSADOR"], default: "AMBASSADOR" },
    passwordSet: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ["PRELOADED", "PASSWORD_PENDING", "ACTIVE", "SUSPENDED"],
      default: "PRELOADED",
    },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date },
    profile: {
      phone: String,
      avatar: String,
      institution: String,
      courseOfStudy: String,
      instagram: String,
      twitter: String,
      linkedin: String,
      facebook: String,
    },
  },
  {
    timestamps: true,
  }
);

const Ambassador = model<IAmbassador>("Ambassador", ambassadorSchema);

export default Ambassador;
