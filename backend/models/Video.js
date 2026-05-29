const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Source Type ───────────────────────────────────────────────────────────
    sourceType: {
      type: String,
      enum: ["youtube", "text", "pdf"],
      required: true,
    },

    // ── YouTube specific ──────────────────────────────────────────────────────
    youtubeUrl:     { type: String, default: "" },
    youtubeVideoId: { type: String, default: "" },

    // ── PDF specific ──────────────────────────────────────────────────────────
    pdfFileName: { type: String, default: "" },

    // ── Common ────────────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    tags:    { type: [String], default: [] },
    rawText: { type: String,   required: true },

    // ── LLM Output (filled in Phase 3) ───────────────────────────────────────
    summary:     { type: String,  default: "" },
    isProcessed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", VideoSchema);
