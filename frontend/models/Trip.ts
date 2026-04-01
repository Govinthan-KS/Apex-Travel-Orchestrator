import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ── TypeScript Interface ── */
export interface ITrip extends Document {
  userId: Types.ObjectId;
  destination: string;
  budget: number;
  days: number;
  date: string; // E.g., "March 2026"
  itinerary: any[]; // The parsed JSON array of the timeline events
  createdAt: Date;
  updatedAt: Date;
}

/* ── Schema Definition ── */
const TripSchema = new Schema<ITrip>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    budget: {
      type: Number,
      required: [true, "Budget is required"],
    },
    days: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    itinerary: {
      type: Schema.Types.Mixed, // Stores the array of timeline events
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ── Model Export (safe for hot-reload) ── */
const Trip: Model<ITrip> =
  mongoose.models.Trip || mongoose.model<ITrip>("Trip", TripSchema);

export default Trip;
