import { Schema, model, Types } from "mongoose";

export interface INotification {
    recipientId: Types.ObjectId;
    recipientRole: "AMBASSADOR" | "ADMIN";
    type: "MESSAGE" | "ANNOUNCEMENT";
    title: string;
    body: string;
    referenceId?: Types.ObjectId;
    read: boolean;
}

const notificationSchema = new Schema<INotification>({
    recipientId: { type: Schema.Types.ObjectId, required: true },
    recipientRole: { type: String, enum: ["AMBASSADOR", "ADMIN"], required: true },
    type: { type: String, enum: ["MESSAGE", "ANNOUNCEMENT"], required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId },
    read: { type: Boolean, default: false },
}, {
    timestamps: true,
})

const Notification = model<INotification>("Notification", notificationSchema);

export default Notification;