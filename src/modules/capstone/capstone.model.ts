import { Schema, model, Types, Document } from "mongoose";

export interface ITeam extends Document {
  name: string;
  founder: Types.ObjectId;
  members: Types.ObjectId[];
  segment: "SOLO" | "SEEKING_COFOUNDERS" | "COLLABORATIVE";
  track?: string;
  ideaDescription?: string;
  status: "OPEN" | "CLOSED";
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    founder: { type: Schema.Types.ObjectId, ref: "Ambassador", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "Ambassador" }],
    segment: { type: String, enum: ["SOLO", "SEEKING_COFOUNDERS", "COLLABORATIVE"], required: true },
    track: { type: String },
    ideaDescription: { type: String },
    status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN" }
  },
  { timestamps: true }
);

export const Team = model<ITeam>("Team", teamSchema);

export interface ICapstoneSubmission extends Document {
  team: Types.ObjectId;
  stage: "PROPOSAL" | "PITCH_DECK";
  content: {
    logoUrl?: string;
    projectTitle?: string;
    problemStatement?: string;
    proposedSolution?: string;
    targetBeneficiaries?: string;
    islamicFinanceRelevance?: string;
    innovationComponent?: string;
    feasibility?: string;
    expectedImpact?: string;
    pitchDeckUrl?: string;
  };
  score?: {
    relevance: number;
    innovation: number;
    clarity: number;
    feasibility: number;
    presentation: number;
    total: number;
    passed: boolean;
  };
  gradedBy?: Types.ObjectId;
}

const submissionSchema = new Schema<ICapstoneSubmission>(
  {
    team: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    stage: { type: String, enum: ["PROPOSAL", "PITCH_DECK"], required: true },
    content: {
      logoUrl: String,
      projectTitle: String,
      problemStatement: String,
      proposedSolution: String,
      targetBeneficiaries: String,
      islamicFinanceRelevance: String,
      innovationComponent: String,
      feasibility: String,
      expectedImpact: String,
      pitchDeckUrl: String,
    },
    score: {
      relevance: Number,
      innovation: Number,
      clarity: Number,
      feasibility: Number,
      presentation: Number,
      total: Number,
      passed: Boolean
    },
    gradedBy: { type: Schema.Types.ObjectId, ref: "Admin" }
  },
  { timestamps: true }
);

export const CapstoneSubmission = model<ICapstoneSubmission>("CapstoneSubmission", submissionSchema);
