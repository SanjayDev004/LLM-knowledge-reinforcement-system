const nodemailer = require("nodemailer");

// ── Create Gmail transporter ──────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// ── Verify connection on startup ──────────────────────────────────────────────
const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Gmail connection verified — email service ready");
  } catch (error) {
    console.error("❌ Gmail connection failed:", error.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Send daily review reminder email
// ─────────────────────────────────────────────────────────────────────────────
const sendReviewReminderEmail = async (user, dueConcepts) => {
  const conceptList = dueConcepts
    .map((c, i) =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
          ${i + 1}. <strong>${c.title}</strong>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">
          <span style="
            background:${c.difficulty === "easy" ? "#d4edda" : c.difficulty === "medium" ? "#fff3cd" : "#f8d7da"};
            color:${c.difficulty === "easy" ? "#155724" : c.difficulty === "medium" ? "#856404" : "#721c24"};
            padding:2px 10px;border-radius:12px;font-size:12px;
          ">${c.difficulty}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#666;font-size:13px;">
          ${c.video?.title || "Your content"}
        </td>
      </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">

      <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px 32px;text-align:center;">
          <h1 style="color:#00d4ff;margin:0;font-size:28px;letter-spacing:1px;">🧠 Cognitive Reinforcement</h1>
          <p style="color:#a0b0c0;margin:8px 0 0;font-size:14px;">Your daily review is ready</p>
        </div>

        <!-- Body -->
        <div style="padding:32px;">

          <p style="color:#333;font-size:16px;margin:0 0 8px;">
            Hey <strong>${user.name}</strong> 👋
          </p>
          <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
            You have <strong style="color:#e74c3c;">${dueConcepts.length} concept${dueConcepts.length > 1 ? "s" : ""}</strong> 
            due for review today. Your brain is at peak forgetting right now — let's fix that!
          </p>

          <!-- Streak badge -->
          ${user.streak > 0 ? `
          <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px 16px;border-radius:6px;margin-bottom:24px;">
            🔥 <strong>Current streak: ${user.streak} day${user.streak > 1 ? "s" : ""}</strong> — Keep it going!
          </div>` : ""}

          <!-- Concepts table -->
          <h3 style="color:#1a1a2e;font-size:16px;margin:0 0 12px;">📚 Due for review today:</h3>
          <table style="width:100%;border-collapse:collapse;background:#fafafa;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f0f4f8;">
                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#666;">Concept</th>
                <th style="padding:10px 12px;text-align:center;font-size:13px;color:#666;">Difficulty</th>
                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#666;">Source</th>
              </tr>
            </thead>
            <tbody>
              ${conceptList}
            </tbody>
          </table>

          <!-- CTA Button -->
          <div style="text-align:center;margin:32px 0;">
            <a href="http://localhost:3000/review" 
               style="background:linear-gradient(135deg,#00d4ff,#0099cc);color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">
              🚀 Start Review Now
            </a>
          </div>

          <!-- SM-2 info -->
          <div style="background:#f0f8ff;border-radius:8px;padding:16px;margin-top:8px;">
            <p style="margin:0;color:#555;font-size:13px;line-height:1.6;">
              💡 <strong>How it works:</strong> Answer each concept correctly and your next review 
              will be pushed further into the future. The more you review, the less often you need to!
            </p>
          </div>

        </div>

        <!-- Footer -->
        <div style="background:#f5f7fa;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:12px;">
            Cognitive Reinforcement System • Powered by Spaced Repetition + AI
          </p>
          <p style="margin:4px 0 0;color:#bbb;font-size:11px;">
            You're receiving this because you have concepts due for review today.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from:    `"${process.env.FROM_NAME}" <${process.env.GMAIL_USER}>`,
    to:      user.email,
    subject: `⏰ ${dueConcepts.length} concept${dueConcepts.length > 1 ? "s" : ""} due for review today — ${user.name}`,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent to ${user.email} — Message ID: ${info.messageId}`);
  return info;
};

// ─────────────────────────────────────────────────────────────────────────────
// Send welcome email on register
// ─────────────────────────────────────────────────────────────────────────────
const sendWelcomeEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f5f7fa;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);padding:40px 32px;text-align:center;">
          <h1 style="color:#00d4ff;margin:0;font-size:28px;">🧠 Welcome to Cognitive Reinforcement!</h1>
        </div>

        <div style="padding:32px;">
          <p style="color:#333;font-size:16px;">Hey <strong>${user.name}</strong> 👋</p>
          <p style="color:#555;font-size:15px;line-height:1.6;">
            Your account is ready. Here's how to get started:
          </p>

          <div style="background:#f0f8ff;border-radius:8px;padding:20px;margin:20px 0;">
            <p style="margin:0 0 12px;font-weight:bold;color:#1a1a2e;">🚀 3 steps to start learning:</p>
            <p style="margin:0 0 8px;color:#555;">1️⃣ &nbsp;Add content — paste a YouTube URL, type notes, or upload a PDF</p>
            <p style="margin:0 0 8px;color:#555;">2️⃣ &nbsp;Let AI extract concepts and generate quiz questions</p>
            <p style="margin:0;color:#555;">3️⃣ &nbsp;Review daily — I'll remind you when concepts are due</p>
          </div>

          <div style="text-align:center;margin:28px 0;">
            <a href="http://localhost:3000" 
               style="background:linear-gradient(135deg,#00d4ff,#0099cc);color:#fff;padding:14px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;display:inline-block;">
              Get Started →
            </a>
          </div>
        </div>

        <div style="background:#f5f7fa;padding:20px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:12px;">Cognitive Reinforcement System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from:    `"${process.env.FROM_NAME}" <${process.env.GMAIL_USER}>`,
    to:      user.email,
    subject: `🎉 Welcome to Cognitive Reinforcement, ${user.name}!`,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Welcome email sent to ${user.email}`);
  return info;
};

module.exports = {
  verifyEmailConnection,
  sendReviewReminderEmail,
  sendWelcomeEmail,
};