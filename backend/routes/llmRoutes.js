const express = require("express");
const router  = express.Router();

const { processVideo, getConceptsByVideo, getQuestionsByConcept } = require("../controllers/llmController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/process/:videoId",       processVideo);
router.get("/concepts/:videoId",       getConceptsByVideo);
router.get("/questions/:conceptId",    getQuestionsByConcept);

module.exports = router;
