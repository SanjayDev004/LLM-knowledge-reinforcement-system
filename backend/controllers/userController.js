const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// ── Get Profile ───────────────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 404, "User not found");
    sendSuccess(res, 200, "Profile fetched successfully", { user });
  } catch (error) {
    sendError(res, 500, "Could not fetch profile");
  }
};

// ── Update Profile ────────────────────────────────────────────────────────────
const updateUserProfile = async (req, res) => {
  try {
    const { name, bio, avatar, notificationsEnabled, preferredReviewTime } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 404, "User not found");

    if (name)                           user.name   = name;
    if (bio  !== undefined)             user.bio    = bio;
    if (avatar !== undefined)           user.avatar = avatar;
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;
    if (preferredReviewTime)            user.preferredReviewTime = preferredReviewTime;

    const updated = await user.save();
    sendSuccess(res, 200, "Profile updated successfully", {
      user: {
        _id:                  updated._id,
        name:                 updated.name,
        email:                updated.email,
        bio:                  updated.bio,
        avatar:               updated.avatar,
        notificationsEnabled: updated.notificationsEnabled,
        preferredReviewTime:  updated.preferredReviewTime,
      },
    });
  } catch (error) {
    sendError(res, 500, "Could not update profile");
  }
};

// ── Change Password ───────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return sendError(res, 404, "User not found");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return sendError(res, 400, "Current password is incorrect");

    user.password = newPassword;
    await user.save();
    sendSuccess(res, 200, "Password changed successfully");
  } catch (error) {
    sendError(res, 500, "Could not change password");
  }
};

// ── Get Stats ─────────────────────────────────────────────────────────────────
const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 404, "User not found");
    sendSuccess(res, 200, "Stats fetched successfully", {
      stats: {
        streak:           user.streak,
        lastActiveDate:   user.lastActiveDate,
        totalVideosAdded: user.totalVideosAdded,
        totalQuizzesDone: user.totalQuizzesDone,
        memberSince:      user.createdAt,
      },
    });
  } catch (error) {
    sendError(res, 500, "Could not fetch stats");
  }
};

module.exports = { getUserProfile, updateUserProfile, changePassword, getUserStats };
