const User          = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendSuccess, sendError } = require("../utils/responseHandler");
const { sendWelcomeEmail } = require("../services/emailService");

const userPayload = (user) => ({
  _id:                  user._id,
  name:                 user.name,
  email:                user.email,
  streak:               user.streak,
  totalVideosAdded:     user.totalVideosAdded,
  totalQuizzesDone:     user.totalQuizzesDone,
  notificationsEnabled: user.notificationsEnabled,
  createdAt:            user.createdAt,
});

// ── Register ──────────────────────────────────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, "An account with this email already exists");
    }

    const user  = await User.create({ name, email, password });
    const token = generateToken(user._id);

    sendWelcomeEmail(user).catch((err) =>
      console.error("Welcome email failed:", err.message)
    );

    sendSuccess(res, 201, "Account created successfully", { token, user: userPayload(user) });
  } catch (error) {
    console.error("Register Error:", error);
    sendError(res, 500, "Registration failed — please try again");
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return sendError(res, 401, "Invalid email or password");

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return sendError(res, 401, "Invalid email or password");

    user.updateStreak();
    await user.save();

    const token = generateToken(user._id);
    sendSuccess(res, 200, "Login successful", { token, user: userPayload(user) });
  } catch (error) {
    console.error("Login Error:", error);
    sendError(res, 500, "Login failed — please try again");
  }
};

// ── Get Me ────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    sendSuccess(res, 200, "User fetched successfully", {
      user: {
        _id:                 req.user._id,
        name:                req.user.name,
        email:               req.user.email,
        bio:                 req.user.bio,
        avatar:              req.user.avatar,
        streak:              req.user.streak,
        lastActiveDate:      req.user.lastActiveDate,
        totalVideosAdded:    req.user.totalVideosAdded,
        totalQuizzesDone:    req.user.totalQuizzesDone,
        notificationsEnabled: req.user.notificationsEnabled,
        preferredReviewTime: req.user.preferredReviewTime,
        createdAt:           req.user.createdAt,
      },
    });
  } catch (error) {
    sendError(res, 500, "Could not fetch user data");
  }
};

module.exports = { registerUser, loginUser, getMe };
