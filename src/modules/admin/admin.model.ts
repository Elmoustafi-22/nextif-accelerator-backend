import { Schema, model, models, Types } from "mongoose";

export interface IAdmin {
  firstName: string;
  lastName: string;
  title: string;
  avatar?: string;
  email: string;
  password: string;
  passwordResetToken?: string | undefined;
  passwordResetExpires?: Date | undefined;
  role: "ADMIN";
  passwordSet: boolean;
  accountStatus: "ACTIVE" | "PRELOADED" | "SUSPENDED";
}


const adminSchema = new Schema<IAdmin>(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    avatar: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date },
    role: { type: String, enum: ["ADMIN"], default: "ADMIN" },
    passwordSet: { type: Boolean, default: false },
    accountStatus: { type: String, enum: ["ACTIVE", "PRELOADED", "SUSPENDED"], default: "ACTIVE" }
  },
  {
    timestamps: true,
  }
);


const Admin = model<IAdmin>("Admin", adminSchema);

export default Admin;