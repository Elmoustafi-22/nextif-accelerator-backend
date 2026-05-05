import { Schema, model, Types } from "mongoose";

export interface IEvent {
  title: string;
  description: string;
  date: Date;
  location?: string;
  type: "WEBINAR" | "MEETING" | "WORKSHOP" | "OTHER";
  createdBy: Types.ObjectId;
  status: "UPCOMING" | "COMPLETED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String },
    type: {
      type: String,
      enum: ["WEBINAR", "MEETING", "WORKSHOP", "OTHER"],
      default: "WEBINAR",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    status: {
      type: String,
      enum: ["UPCOMING", "COMPLETED", "CANCELLED"],
      default: "UPCOMING",
    },
  },
  {
    timestamps: true,
  }
);

export const Event = model<IEvent>("Event", eventSchema);
export default Event;
