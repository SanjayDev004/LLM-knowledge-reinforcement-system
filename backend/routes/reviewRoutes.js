const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");

const {
  getDueConcepts,
  submitReview,
  getReviewStats,
  getProgress,
  submitBatchReview,
  deleteConceptFromQueue,
} = require("../controllers/reviewController");

const { protect }  = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");

router.use(protect);

const submitValidation = [
  body("conceptId").notEmpty().withMessage("conceptId is required"),
  body("questionId").notEmpty().withMessage("questionId is required"),
  body("userAnswer").trim().notEmpty().withMessage("userAnswer is required"),
];

// GET  /api/review/due       → concepts due today
router.get("/due",      getDueConcepts);

// POST /api/review/submit    → submit answer + update SM2 schedule
router.post("/submit",  submitValidation, validate, submitReview);

// GET  /api/review/stats     → user review statistics
router.get("/stats",    getReviewStats);

// GET  /api/review/progress  → all concepts with schedule
router.get("/progress", getProgress);

router.post("/submit-batch", protect, submitBatchReview);

router.delete("/:conceptId", deleteConceptFromQueue);

module.exports = router;