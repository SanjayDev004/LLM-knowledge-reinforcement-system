const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conceptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Concept",
      required: true,
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },

    // ── Question Content ──────────────────────────────────────────────────────
    type: {
      type: String,
      enum: ["mcq", "fillblank", "coding"],
      required: true,
    },
    question:    { type: String, required: true },
    options:     { type: [String], default: [] },
    answer:      { type: String,   required: true },
    explanation: { type: String,   default: "" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Question", QuestionSchema);
