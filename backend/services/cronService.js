const cron    = require("node-cron");
const User    = require("../models/User");
const Concept = require("../models/Concept");
const { sendReviewReminderEmail } = require("./emailService");

const startCronJobs = () => {

  // Cron syntax: "0 8 * * *" = at 8:00 AM every day
  cron.schedule("0 8 * * *", async () => {
    console.log("\n⏰ CRON: Daily review reminder job started —", new Date().toLocaleString());

    try {
      // Get all users with notifications enabled
      const users = await User.find({ notificationsEnabled: true });
      console.log(`👥 Found ${users.length} users with notifications enabled`);

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      let emailsSent = 0;

      for (const user of users) {
        try {
          // Find due concepts for this user
          const dueConcepts = await Concept.find({
            userId:      user._id,
            isRetained:  false,
            "schedule.nextReviewDate": { $lte: today },
          })
            .populate("videoId", "title")
            .limit(10); // max 10 concepts per email

          if (dueConcepts.length === 0) {
            console.log(`⏭️  No due concepts for ${user.email} — skipping`);
            continue;
          }

          // Send reminder email
          await sendReviewReminderEmail(user, dueConcepts);
          emailsSent++;

          // Small delay between emails — avoid Gmail rate limits
          await new Promise((resolve) => setTimeout(resolve, 1000));

        } catch (userError) {
          console.error(`❌ Failed to send email to ${user.email}:`, userError.message);
        }
      }

      console.log(`✅ CRON: Daily reminder done — ${emailsSent} emails sent\n`);

    } catch (error) {
      console.error("❌ CRON job failed:", error.message);
    }
  });

  console.log("✅ Cron jobs registered — daily reminder at 8:00 AM");
};

module.exports = { startCronJobs };