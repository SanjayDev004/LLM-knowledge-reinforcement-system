const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");
const dotenv  = require("dotenv");

dotenv.config();
const connectDB = require("./config/db");
const { startCronJobs }            = require("./services/cronService");
const { verifyEmailConnection }    = require("./services/emailService");



connectDB();

startCronJobs();
verifyEmailConnection();

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}


app.use("/api/auth",  require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/input", require("./routes/inputRoutes"));
app.use("/api/llm",   require("./routes/llmRoutes"));
app.use("/api/review", require("./routes/reviewRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: " Cognitive Reinforcement API is running",
    version: "1.0.0",
    phases:  "Phase 1 + Phase 2 + Phase 3",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});


app.use((err, req, res, next) => {
  console.error(" Error:", err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(` http://localhost:${PORT}\n`);
});
