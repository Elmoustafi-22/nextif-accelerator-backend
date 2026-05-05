import { Schema, model, Types } from "mongoose";

export interface IComplaint {
    ambassadorId: Types.ObjectId;
    subject?: string;
    message: string;
    adminResponse?: string;
    status: "SUBMITTED" | "UNDER_REVIEW" | "RESOLVED";
}

const compliantSchema = new Schema<IComplaint>({
    ambassadorId: { type: Schema.Types.ObjectId, ref: "Ambassador", required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    adminResponse: { type: String },
    status: { type: String, enum: ["SUBMITTED", "UNDER_REVIEW", "RESOLVED"], default: "SUBMITTED" },

}, {
    timestamps: true
})

const Complaint = model<IComplaint>("Complaint", compliantSchema);

export default Complaint;