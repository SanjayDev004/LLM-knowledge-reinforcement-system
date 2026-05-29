const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");

const { getUserProfile, updateUserProfile, changePassword, getUserStats } = require("../controllers/userController");
const { protect }  = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");

router.use(protect);

const updateProfileValidation = [
  body("name").optional().trim()
    .isLength({ min: 2 }).withMessage("Name must be at least 2 characters")
    .isLength({ max: 50 }).withMessage("Name cannot exceed 50 characters"),
  body("bio").optional().isLength({ max: 200 }).withMessage("Bio cannot exceed 200 characters"),
  body("preferredReviewTime").optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Time must be in HH:MM format"),
];

const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

router.get("/profile",         getUserProfile);
router.put("/profile",         updateProfileValidation, validate, updateUserProfile);
router.put("/change-password", changePasswordValidation, validate, changePassword);
router.get("/stats",           getUserStats);
router.put("/update-email", protect, async (req, res) => {
  const User = require("../models/User");
  const { email } = req.body;
  await User.findByIdAndUpdate(req.user._id, { email });
  res.json({ success: true, message: "Email updated" });
});

module.exports = router;
