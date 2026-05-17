import { Schema, model, Types } from "mongoose";

export interface IPayment {
  ambassadorId: Types.ObjectId;
  reference: string;
  amount: number;
  currency: "NGN" | "USD";
  status: "PENDING" | "SUCCESS" | "FAILED";
  paymentType: "CERTIFICATE";
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    ambassadorId: {
      type: Schema.Types.ObjectId,
      ref: "Ambassador",
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["NGN", "USD"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    paymentType: {
      type: String,
      enum: ["CERTIFICATE"],
      default: "CERTIFICATE",
    },
    metadata: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = model<IPayment>("Payment", paymentSchema);

export default Payment;
