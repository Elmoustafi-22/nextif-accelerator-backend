import { Schema, model, Types } from "mongoose";
import { IAdmin } from "../admin/admin.model";

export interface ITask {
  title: string;
  explanation: string;
  type: "WEEKLY" | "MONTHLY" | "ADHOC";
  verificationType: "AUTO" | "ADMIN";
  assignedTo: Types.ObjectId[];
  rewardPoints: number;
  dueDate: Date;
  isBonus: boolean;
  requirements: ("FILE" | "LINK" | "TEXT")[];
  whatToDo: {
    _id?: Types.ObjectId;
    title: string;
    description: string;
  }[];
  materials: {
    title: string;
    url: string;
    type: "VIDEO" | "PDF" | "LINK";
  }[];
  createdBy: Types.ObjectId | IAdmin;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    explanation: { type: String, required: true },
    type: {
      type: String,
      enum: ["WEEKLY", "MONTHLY", "ADHOC"],
      required: true,
    },
    verificationType: {
      type: String,
      enum: ["AUTO", "ADMIN"],
      default: "AUTO",
    },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: "Ambassador" }],
    rewardPoints: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    isBonus: { type: Boolean, default: false },
    requirements: [
      { type: String, enum: ["FILE", "LINK", "TEXT"], default: ["TEXT"] },
    ],
    whatToDo: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
      },
    ],
    materials: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, enum: ["VIDEO", "PDF", "LINK"], required: true },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  {
    timestamps: true,
  }
);

const Task = model<ITask>("Task", taskSchema);

export default Task;
