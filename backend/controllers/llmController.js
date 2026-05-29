const Video    = require("../models/Video");
const Concept  = require("../models/Concept");
const Question = require("../models/Question");
const { generateSummary, extractConcepts, generateQuestions } = require("../services/llmService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// ── Process video through Qwen ────────────────────────────────────────────────
const processVideo = async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.videoId, userId: req.user._id });

    if (!video)                               return sendError(res, 404, "Content not found");
    if (video.isProcessed)                    return sendError(res, 400, "Already processed — check /api/llm/concepts/:videoId");
    if (!video.rawText || video.rawText.length < 50) return sendError(res, 400, "Content is too short to process");

    console.log(`\n🧠 Starting LLM processing for: "${video.title}"`);
    console.log(`📝 Text length: ${video.rawText.length} characters`);
    console.log(`🤖 Model: ${process.env.QWEN_MODEL}`);

    // Step 1 — Summary
    console.log("\n⏳ Step 1/3 — Generating summary...");
    const summary = await generateSummary(video.rawText);
    console.log("✅ Summary done");

    // Step 2 — Concepts
    console.log("⏳ Step 2/3 — Extracting concepts...");
    const conceptsData = await extractConcepts(video.rawText);
    console.log(`✅ ${conceptsData.length} concepts extracted`);

    // Step 3 — Questions per concept
    console.log("⏳ Step 3/3 — Generating quiz questions...");
    const savedConcepts  = [];
    let   totalQuestions = 0;

    for (const cData of conceptsData) {
      const concept = await Concept.create({
        userId:      req.user._id,
        videoId:     video._id,
        title:       cData.title,
        explanation: cData.explanation,
        difficulty:  cData.difficulty,
        schedule: {
          nextReviewDate: new Date(),
          interval:       1,
          easeFactor:     2.5,
          repetitions:    0,
        },
      });

      const questionsData = await generateQuestions(cData);

      for (const qData of questionsData) {
        if (!qData.question || !qData.answer) continue;
        await Question.create({
          userId:      req.user._id,
          conceptId:   concept._id,
          videoId:     video._id,
          type:        qData.type,
          question:    qData.question,
          options:     qData.options     || [],
          answer:      qData.answer,
          explanation: qData.explanation || "",
          difficulty:  qData.difficulty  || cData.difficulty,
        });
        totalQuestions++;
      }

      console.log(`  ✅ "${concept.title}" — ${questionsData.length} questions saved`);
      savedConcepts.push(concept);
    }

    // Mark as processed
    video.summary     = summary;
    video.isProcessed = true;
    await video.save();

    console.log(`\n🎉 Done! Concepts: ${savedConcepts.length} | Questions: ${totalQuestions}`);

    sendSuccess(res, 200, "Content processed successfully", {
      video:          { _id: video._id, title: video.title, summary, isProcessed: true },
      conceptsCount:  savedConcepts.length,
      questionsCount: totalQuestions,
      concepts: savedConcepts.map((c) => ({
        _id: c._id, title: c.title, difficulty: c.difficulty, explanation: c.explanation,
      })),
    });
  } catch (error) {
    console.error("\n❌ LLM Process Error:", error.message);
    sendError(res, 500, "Processing failed: " + error.message);
  }
};

// ── Get concepts for a video ──────────────────────────────────────────────────
const getConceptsByVideo = async (req, res) => {
  try {
    const concepts = await Concept.find({ videoId: req.params.videoId, userId: req.user._id }).sort({ createdAt: 1 });
    sendSuccess(res, 200, "Concepts fetched successfully", { count: concepts.length, concepts });
  } catch (error) {
    sendError(res, 500, "Failed to fetch concepts");
  }
};

// ── Get questions for a concept ───────────────────────────────────────────────
const getQuestionsByConcept = async (req, res) => {
  try {
    const questions = await Question.find({ conceptId: req.params.conceptId, userId: req.user._id });
    sendSuccess(res, 200, "Questions fetched successfully", { count: questions.length, questions });
  } catch (error) {
    sendError(res, 500, "Failed to fetch questions");
  }
};

module.exports = { processVideo, getConceptsByVideo, getQuestionsByConcept };
