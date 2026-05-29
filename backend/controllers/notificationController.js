const { sendReviewReminderEmail, sendWelcomeEmail } = require("../services/emailService");
const Concept  = require("../models/Concept");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Manually trigger review reminder email (for testing)
// @route   POST /api/notifications/send-reminder
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const sendManualReminder = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dueConcepts = await Concept.find({
      userId:      req.user._id,
      isRetained:  false,
      "schedule.nextReviewDate": { $lte: today },
    }).populate("videoId", "title");

    if (dueConcepts.length === 0) {
      return sendSuccess(res, 200, "No concepts due today — no email sent", {
        emailSent: false,
      });
    }

    await sendReviewReminderEmail(req.user, dueConcepts);

    sendSuccess(res, 200, "Review reminder email sent successfully", {
      emailSent:     true,
      sentTo:        req.user.email,
      conceptsCount: dueConcepts.length,
    });
  } catch (error) {
    console.error("SendReminder Error:", error.message);
    sendError(res, 500, "Failed to send reminder email: " + error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Send welcome email (for testing)
// @route   POST /api/notifications/send-welcome
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const sendTestWelcome = async (req, res) => {
  try {
    await sendWelcomeEmail(req.user);
    sendSuccess(res, 200, "Welcome email sent successfully", {
      sentTo: req.user.email,
    });
  } catch (error) {
    console.error("SendWelcome Error:", error.message);
    sendError(res, 500, "Failed to send welcome email: " + error.message);
  }
};

module.exports = { sendManualReminder, sendTestWelcome };