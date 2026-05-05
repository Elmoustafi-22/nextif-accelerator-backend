import { Schema, model, Types } from "mongoose";

export interface IAttendance {
  event: Types.ObjectId;
  ambassador: Types.ObjectId;
  status: "PRESENT" | "ABSENT" | "EXCUSED";
  markedBy: Types.ObjectId;
  markedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    ambassador: {
      type: Schema.Types.ObjectId,
      ref: "Ambassador",
      required: true,
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "EXCUSED"],
      required: true,
    },
    markedBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    markedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance records for the same event and ambassador
attendanceSchema.index({ event: 1, ambassador: 1 }, { unique: true });

export const Attendance = model<IAttendance>("Attendance", attendanceSchema);
export default Attendance;
