const express = require("express");
const router  = express.Router();

const { sendManualReminder, sendTestWelcome } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

// POST /api/notifications/send-reminder  → manually trigger reminder email
router.post("/send-reminder", sendManualReminder);

// POST /api/notifications/send-welcome   → send welcome email (testing)
router.post("/send-welcome",  sendTestWelcome);

module.exports = router;