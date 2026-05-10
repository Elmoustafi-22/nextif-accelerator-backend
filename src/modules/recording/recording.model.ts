import { Schema, model } from "mongoose";

export interface IRecordingLink {
  title: string;
  url: string;
}

export interface IRecording {
  title: string;
  description?: string;
  links: IRecordingLink[];
  createdAt: Date;
}

const recordingSchema = new Schema<IRecording>(
  {
    title: { type: String, required: true },
    description: { type: String },
    links: [{ 
        title: { type: String, required: true },
        url: { type: String, required: true }
    }],
  },
  { timestamps: true }
);

const Recording = model<IRecording>("Recording", recordingSchema);

export default Recording;
