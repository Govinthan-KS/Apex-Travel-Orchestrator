import mongoose, { Schema, Document, Model, Types } from "mongoose";

/* ── TypeScript Interface ── */
export interface IFrequencyWeight extends Document {
  userId: Types.ObjectId;
  flightClass: Map<string, number>;
  stayTier: Map<string, number>;
  interests: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

/* ── Schema Definition ── */
const FrequencyWeightSchema = new Schema<IFrequencyWeight>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      unique: true,
      index: true,
    },

    /**
     * Soft Preferences stored as Maps so individual keys
     * can be incremented atomically with $inc:
     *
     *   FrequencyWeight.updateOne(
     *     { userId },
     *     { $inc: { "flightClass.business": 1 } }
     *   );
     */
    flightClass: {
      type: Map,
      of: Number,
      default: () =>
        new Map([
          ["economy", 0],
          ["premium_economy", 0],
          ["business", 0],
          ["first", 0],
        ]),
    },

    stayTier: {
      type: Map,
      of: Number,
      default: () =>
        new Map([
          ["budget", 0],
          ["mid_range", 0],
          ["luxury", 0],
          ["resort", 0],
        ]),
    },

    interests: {
      type: Map,
      of: Number,
      default: () =>
        new Map([
          ["culture", 0],
          ["adventure", 0],
          ["food", 0],
          ["nightlife", 0],
          ["nature", 0],
          ["shopping", 0],
          ["relaxation", 0],
        ]),
    },
  },
  {
    timestamps: true,
  }
);

/* ── Model Export (safe for hot-reload) ── */
const FrequencyWeight: Model<IFrequencyWeight> =
  mongoose.models.FrequencyWeight ||
  mongoose.model<IFrequencyWeight>("FrequencyWeight", FrequencyWeightSchema);

export default FrequencyWeight;
