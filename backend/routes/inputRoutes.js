const express = require("express");
const router  = express.Router();
const { body } = require("express-validator");

const { submitYoutube, submitText, submitPDF, getAllInputs, getInputById, deleteInput } = require("../controllers/inputController");
const { protect }  = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const upload       = require("../middleware/uploadMiddleware");

router.use(protect);

const youtubeValidation = [
  body("url").trim().notEmpty().withMessage("YouTube URL is required")
    .isURL().withMessage("Please enter a valid URL"),
  body("title").optional().trim().isLength({ max: 200 }).withMessage("Title cannot exceed 200 characters"),
];

const textValidation = [
  body("title").trim().notEmpty().withMessage("Title is required")
    .isLength({ max: 200 }).withMessage("Title cannot exceed 200 characters"),
  body("content").trim().notEmpty().withMessage("Content is required")
    .isLength({ min: 50 }).withMessage("Content must be at least 50 characters")
    .isLength({ max: 50000 }).withMessage("Content cannot exceed 50,000 characters"),
];

router.post("/youtube", youtubeValidation, validate, submitYoutube);
router.post("/text",    textValidation,    validate, submitText);
router.post("/pdf",     upload.single("pdf"),        submitPDF);
router.get("/all",      getAllInputs);
router.get("/:id",      getInputById);
router.delete("/:id",   deleteInput);

module.exports = router;
