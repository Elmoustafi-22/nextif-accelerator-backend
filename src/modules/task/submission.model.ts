import { Schema, model, Types } from "mongoose";

export interface ITaskSubmission {
  taskId: Types.ObjectId;
  ambassadorId: Types.ObjectId;
  status: "NOT_STARTED" | "SUBMITTED" | "COMPLETED" | "REJECTED" | "REDO";
  individualDueDate?: Date;
  proofFiles?: string[];
  links?: string[];
  responses?: {
    whatToDoId: Types.ObjectId;
    text: string;
  }[];
  content?: string;
  adminFeedback?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
}

const submissionSchema = new Schema<ITaskSubmission>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    ambassadorId: {
      type: Schema.Types.ObjectId,
      ref: "Ambassador",
      required: true,
    },
    status: {
      type: String,
      enum: ["NOT_STARTED", "SUBMITTED", "COMPLETED", "REJECTED", "REDO"],
      default: "NOT_STARTED",
    },
    individualDueDate: Date,
    proofFiles: [String],
    links: [String],
    responses: [
      {
        whatToDoId: { type: Schema.Types.ObjectId, required: true },
        text: { type: String, required: true },
      },
    ],
    content: String,
    adminFeedback: String,
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ taskId: 1, ambassadorId: 1 }, { unique: true });

const TaskSubmission = model<ITaskSubmission>(
  "TaskSubmission",
  submissionSchema
);

export default TaskSubmission;
