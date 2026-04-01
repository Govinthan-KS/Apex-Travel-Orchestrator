import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ── Hard Constraint Enums ── */
export type DietaryOption =
  | "none"
  | "vegetarian"
  | "vegan"
  | "halal"
  | "kosher"
  | "gluten-free"
  | "other";

export type TravelPace = "relaxed" | "moderate" | "intensive";

/* ── TypeScript Interface ── */
export interface ISurvey extends Document {
  userId: Types.ObjectId;
  dietary: DietaryOption;
  homeHub: string;
  accessibility: string[];
  travelPace: TravelPace;
  createdAt: Date;
  updatedAt: Date;
}

/* ── Schema Definition ── */
const SurveySchema = new Schema<ISurvey>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },
    dietary: {
      type: String,
      enum: ["none", "vegetarian", "vegan", "halal", "kosher", "gluten-free", "other"],
      default: "none",
    },
    homeHub: {
      type: String,
      required: [true, "Home hub city/airport is required"],
      trim: true,
    },
    accessibility: {
      type: [String],
      default: [],
    },
    travelPace: {
      type: String,
      enum: ["relaxed", "moderate", "intensive"],
      default: "moderate",
    },
  },
  {
    timestamps: true,
  }
);

/* ── Model Export (safe for hot-reload) ── */
const Survey: Model<ISurvey> =
  mongoose.models.Survey || mongoose.model<ISurvey>("Survey", SurveySchema);

export default Survey;
