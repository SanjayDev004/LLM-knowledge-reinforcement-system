const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar:   { type: String, default: "" },
    bio:      { type: String, maxlength: [200, "Bio cannot exceed 200 characters"], default: "" },

    // ── Learning Stats ────────────────────────────────────────────────────────
    streak:           { type: Number, default: 0 },
    lastActiveDate:   { type: Date,   default: null },
    totalVideosAdded: { type: Number, default: 0 },
    totalQuizzesDone: { type: Number, default: 0 },

    // ── Settings ──────────────────────────────────────────────────────────────
    isEmailVerified:      { type: Boolean, default: false },
    notificationsEnabled: { type: Boolean, default: true },
    preferredReviewTime:  { type: String,  default: "08:00" },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update streak
UserSchema.methods.updateStreak = function () {
  const today     = new Date().toDateString();
  const lastActive = this.lastActiveDate ? new Date(this.lastActiveDate).toDateString() : null;
  if (lastActive === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  this.streak = lastActive === yesterday.toDateString() ? this.streak + 1 : 1;
  this.lastActiveDate = new Date();
};

module.exports = mongoose.model("User", UserSchema);
