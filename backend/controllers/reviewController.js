const Concept = require("../models/Concept");
const Question = require("../models/Question");
const User = require("../models/User");
const { calculateNextReview, isDueToday, getVerdict } = require("../services/sm2Service");
const { evaluateAnswer } = require("../services/llmService");
const { sendSuccess, sendError } = require("../utils/responseHandler");


const getDueConcepts = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Find all concepts due today or overdue — not yet retained
    const dueConcepts = await Concept.find({
      userId: req.user._id,
      isRetained: false,
      "schedule.nextReviewDate": { $lte: today },
    })
      .populate("videoId", "title sourceType") // get video title
      .sort({ "schedule.nextReviewDate": 1 });  // oldest due first

    // For each concept get its questions
    const conceptsWithQuestions = await Promise.all(
      dueConcepts.map(async (concept) => {
        const questions = await Question.find({
          conceptId: concept._id,
          userId: req.user._id,
        }).select("-answer -explanation"); // hide answer from user during quiz

        return {
          _id: concept._id,
          title: concept.title,
          explanation: concept.explanation,
          difficulty: concept.difficulty,
          schedule: concept.schedule,
          video: {
            _id: concept.videoId?._id,
            title: concept.videoId?.title,
            sourceType: concept.videoId?.sourceType,
          },
          questions,
        };
      })
    );

    sendSuccess(res, 200, "Due concepts fetched successfully", {
      count: dueConcepts.length,
      concepts: conceptsWithQuestions,
    });
  } catch (error) {
    console.error("GetDueConcepts Error:", error.message);
    sendError(res, 500, "Failed to fetch due concepts");
  }
};


const submitReview = async (req, res) => {
  try {
    const { conceptId, questionId, userAnswer } = req.body;

    if (!conceptId || !questionId || !userAnswer) {
      return sendError(res, 400, "conceptId, questionId and userAnswer are required");
    }

    // ── Find concept and question ─────────────────────────────────────────────
    const concept = await Concept.findOne({
      _id: conceptId,
      userId: req.user._id,
    });

    if (!concept) return sendError(res, 404, "Concept not found");

    const question = await Question.findOne({
      _id: questionId,
      conceptId: conceptId,
      userId: req.user._id,
    });

    if (!question) return sendError(res, 404, "Question not found");

    // ── Evaluate answer using LLM ─────────────────────────────────────────────
    console.log(`\n📝 Evaluating answer for: "${question.question}"`);
    const evaluation = await evaluateAnswer(
      question.question,
      question.answer,
      userAnswer
    );

    console.log(`✅ Score: ${evaluation.score}/5 — ${evaluation.verdict}`);

    // ── Update SM-2 schedule ──────────────────────────────────────────────────
    const newSchedule = calculateNextReview(concept.schedule, evaluation.score);

    concept.schedule = newSchedule;

    // Mark as retained if reviewed successfully 5+ times
    if (newSchedule.repetitions >= 5) {
      concept.isRetained = true;
      console.log(`🎉 Concept "${concept.title}" is now RETAINED!`);
    }

    await concept.save();

    // ── Update user stats ─────────────────────────────────────────────────────
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalQuizzesDone: 1 },
    });

    // Update streak
    const user = await User.findById(req.user._id);
    user.updateStreak();
    await user.save();

    sendSuccess(res, 200, "Review submitted successfully", {
      evaluation: {
        score: evaluation.score,
        verdict: getVerdict(evaluation.score),
        feedback: evaluation.feedback,
        hint: evaluation.hint || "",
      },
      correctAnswer: question.answer,
      explanation: question.explanation,
      nextReview: {
        date: newSchedule.nextReviewDate,
        interval: newSchedule.interval,
        repetitions: newSchedule.repetitions,
        isRetained: concept.isRetained,
      },
    });
  } catch (error) {
    console.error("SubmitReview Error:", error.message);
    sendError(res, 500, "Failed to submit review: " + error.message);
  }
};


const getReviewStats = async (req, res) => {
  try {
    const totalConcepts = await Concept.countDocuments({ userId: req.user._id });
    const retainedCount = await Concept.countDocuments({ userId: req.user._id, isRetained: true });

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dueToday = await Concept.countDocuments({
      userId: req.user._id,
      isRetained: false,
      "schedule.nextReviewDate": { $lte: today },
    });

    // Concepts by difficulty
    const easy = await Concept.countDocuments({ userId: req.user._id, difficulty: "easy" });
    const medium = await Concept.countDocuments({ userId: req.user._id, difficulty: "medium" });
    const hard = await Concept.countDocuments({ userId: req.user._id, difficulty: "hard" });

    sendSuccess(res, 200, "Stats fetched successfully", {
      stats: {
        totalConcepts,
        retainedCount,
        inProgressCount: totalConcepts - retainedCount,
        dueToday,
        retentionRate: totalConcepts > 0
          ? Math.round((retainedCount / totalConcepts) * 100)
          : 0,
        byDifficulty: { easy, medium, hard },
        streak: req.user.streak,
        totalQuizzesDone: req.user.totalQuizzesDone,
      },
    });
  } catch (error) {
    console.error("GetReviewStats Error:", error.message);
    sendError(res, 500, "Failed to fetch review stats");
  }
};

const getProgress = async (req, res) => {
  try {
    const concepts = await Concept.find({ userId: req.user._id })
      .populate("videoId", "title")
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, "Progress fetched successfully", {
      count: concepts.length,
      concepts: concepts.map((c) => ({
        _id: c._id,
        title: c.title,
        difficulty: c.difficulty,
        isRetained: c.isRetained,
        video: c.videoId?.title || "Unknown",
        schedule: {
          nextReviewDate: c.schedule.nextReviewDate,
          interval: c.schedule.interval,
          repetitions: c.schedule.repetitions,
          easeFactor: c.schedule.easeFactor,
        },
      })),
    });
  } catch (error) {
    console.error("GetProgress Error:", error.message);
    sendError(res, 500, "Failed to fetch progress");
  }
};


const submitBatchReview = async (req, res) => {
  try {
    const { conceptId, answers } = req.body;

    // answers = [{ questionId, userAnswer }, ...]
    if (!conceptId || !answers || !Array.isArray(answers) || answers.length === 0) {
      return sendError(res, 400, "conceptId and answers array are required");
    }

    const concept = await Concept.findOne({
      _id: conceptId,
      userId: req.user._id,
    });

    if (!concept) return sendError(res, 404, "Concept not found");

    console.log(`\n📝 Batch evaluating ${answers.length} answers for: "${concept.title}"`);

    // ── Evaluate all answers ──────────────────────────────────────────────────
    const results = [];
    let totalScore = 0;

    for (const answer of answers) {
      const question = await Question.findOne({
        _id: answer.questionId,
        conceptId: conceptId,
        userId: req.user._id,
      });

      if (!question) continue;

      // MCQ — exact match, no LLM needed
      let evaluation;
      if (question.type === "mcq") {
        const isRight = question.answer.trim().toLowerCase() ===
          answer.userAnswer.trim().toLowerCase();
        evaluation = {
          score: isRight ? 5 : 0,
          verdict: isRight ? "correct" : "wrong",
          feedback: isRight
            ? "Correct! You selected the right option."
            : `Wrong. You selected "${answer.userAnswer}" but the correct answer is "${question.answer}".`,
          hint: isRight ? "" : "Review the concept and try again.",
        };
      } else {
        // Fillblank / Coding — use LLM
        evaluation = await evaluateAnswer(
          question.question,
          question.answer,
          answer.userAnswer
        );
      }

      totalScore += evaluation.score;

      results.push({
        questionId: question._id,
        type: question.type,
        question: question.question,
        userAnswer: answer.userAnswer,
        correctAnswer: question.answer,
        explanation: question.explanation,
        evaluation,
      });

      console.log(`  ✅ "${question.type}" — score: ${evaluation.score}/5`);
    }

    // ── Calculate average score ───────────────────────────────────────────────
    const avgScore = results.length > 0
      ? Math.round(totalScore / results.length)
      : 0;

    // ── Update SM-2 schedule based on average score ───────────────────────────
    const newSchedule = calculateNextReview(concept.schedule, avgScore);
    concept.schedule = newSchedule;

    if (newSchedule.repetitions >= 4) {
      concept.isRetained = true;
      console.log(`🎉 Concept "${concept.title}" is now RETAINED!`);
    }

    await concept.save();

    // ── Update user stats ─────────────────────────────────────────────────────
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalQuizzesDone: 1 },
    });

    const user = await User.findById(req.user._id);
    user.updateStreak();
    await user.save();

    console.log(`\n✅ Batch evaluation done — avg score: ${avgScore}/5`);

    sendSuccess(res, 200, "Batch review submitted successfully", {
      results,
      summary: {
        totalQuestions: results.length,
        totalScore,
        avgScore,
        percentage: Math.round((totalScore / (results.length * 5)) * 100),
      },
      nextReview: {
        date: newSchedule.nextReviewDate,
        interval: newSchedule.interval,
        repetitions: newSchedule.repetitions,
        isRetained: concept.isRetained,
      },
    });

  } catch (error) {
    console.error("BatchReview Error:", error.message);
    sendError(res, 500, "Failed to submit batch review: " + error.message);
  }
};


const deleteConceptFromQueue = async (req, res) => {
  try {
    const concept = await Concept.findOne({
      _id:    req.params.conceptId,
      userId: req.user._id,
    });

    if (!concept) return sendError(res, 404, "Concept not found");

    // Delete concept and all its questions
    await Concept.deleteOne({ _id: concept._id });
    await Question.deleteMany({ conceptId: concept._id });

    sendSuccess(res, 200, "Concept removed from review queue", {
      deletedId: concept._id,
    });
  } catch (error) {
    console.error("DeleteConcept Error:", error.message);
    sendError(res, 500, "Failed to delete concept");
  }
};

module.exports = { getDueConcepts, submitBatchReview, submitReview, getReviewStats, getProgress, deleteConceptFromQueue };