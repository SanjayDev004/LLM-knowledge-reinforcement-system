const mongoose = require("mongoose");

const ConceptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },

    // ── Core Content ──────────────────────────────────────────────────────────
    title:       { type: String, required: true, trim: true },
    explanation: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    // ── Spaced Repetition (used in Phase 4) ───────────────────────────────────
    schedule: {
      nextReviewDate: { type: Date,   default: () => new Date() },
      interval:       { type: Number, default: 1 },
      easeFactor:     { type: Number, default: 2.5 },
      repetitions:    { type: Number, default: 0 },
    },

    isRetained: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Concept", ConceptSchema);
