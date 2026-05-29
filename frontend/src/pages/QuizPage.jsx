import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";
import LoadingSpinner from "../components/LoadingSpinner";

const QuizPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [concept,    setConcept]    = useState(null);
  const [questions,  setQuestions]  = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers,    setAnswers]    = useState([]); // store all answers
  const [userAnswer, setUserAnswer] = useState("");
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results,    setResults]    = useState(null); // final results
  const [error,      setError]      = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dueRes = await api.get("/review/due");
        const found  = dueRes.data.data.concepts.find((c) => c._id === id);
        if (!found) { navigate("/review"); return; }
        setConcept(found);
        setQuestions(found.questions || []);
      } catch (err) {
        console.error(err);
        navigate("/review");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ── Save current answer and move to next question ─────────────────────────
  const handleNext = () => {
    if (!userAnswer.trim()) return;

    const newAnswers = [
      ...answers,
      {
        questionId: questions[currentIdx]._id,
        userAnswer: userAnswer.trim(),
      },
    ];
    setAnswers(newAnswers);

    if (currentIdx + 1 < questions.length) {
      // More questions — go to next
      setCurrentIdx((prev) => prev + 1);
      setUserAnswer("");
    } else {
      // All answered — submit all at once
      submitAll(newAnswers);
    }
  };

  // ── Submit all answers to backend at once ─────────────────────────────────
  const submitAll = async (allAnswers) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/review/submit-batch", {
        conceptId: id,
        answers:   allAnswers,
      });
      setResults(res.data.data);
      setSubmitting(false);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed — please try again");
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner text="Loading quiz..." />;

  // ── AI Evaluation Loading Screen ──────────────────────────────────────────
  if (submitting) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card text-center py-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-light-text dark:text-dark-text mb-2">
            🧠 AI is evaluating your answers...
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Analysing all {answers.length} answers together. This takes a few seconds.
          </p>
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Results Screen ────────────────────────────────────────────────────────
  if (results) {
    const { summary, nextReview } = results;
    const percentage = summary.percentage;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Score header */}
        <div className="card text-center mb-6">
          <p className="text-5xl mb-3">
            {percentage >= 80 ? "🎉" : percentage >= 60 ? "👍" : "📚"}
          </p>
          <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-1">
            Session Complete!
          </h2>
          <p className="text-gray-400 mb-4">{concept?.title}</p>

          <div className="bg-light-bg dark:bg-dark-bg rounded-xl p-4 mb-4">
            <p className="text-4xl font-bold text-primary">{percentage}%</p>
            <p className="text-sm text-gray-400 mt-1">
              {summary.totalScore} / {summary.totalQuestions * 5} points
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${
                percentage >= 80 ? "bg-green-400" :
                percentage >= 60 ? "bg-yellow-400" : "bg-red-400"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Next review info */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <span>Next review in {nextReview.interval} day{nextReview.interval > 1 ? "s" : ""}</span>
            {nextReview.isRetained && (
              <span className="text-green-400 font-semibold">🏆 Concept Retained!</span>
            )}
          </div>
        </div>

        {/* Individual question results */}
        <h3 className="font-semibold text-light-text dark:text-dark-text mb-3">
          Detailed Results
        </h3>
        <div className="space-y-4 mb-6">
          {results.results.map((r, i) => (
            <div
              key={r.questionId}
              className={`card border ${
                r.evaluation.score >= 4 ? "border-green-500/30 bg-green-500/5" :
                r.evaluation.score === 3 ? "border-yellow-500/30 bg-yellow-500/5" :
                "border-red-500/30 bg-red-500/5"
              }`}
            >
              {/* Question header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Q{i + 1}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    r.type === "mcq"       ? "bg-blue-500/10 text-blue-400"     :
                    r.type === "fillblank" ? "bg-purple-500/10 text-purple-400" :
                    "bg-orange-500/10 text-orange-400"
                  }`}>
                    {r.type === "mcq" ? "MCQ" : r.type === "fillblank" ? "Fill Blank" : "Coding"}
                  </span>
                </div>
                <span className={`font-bold text-sm ${
                  r.evaluation.score >= 4 ? "text-green-400" :
                  r.evaluation.score === 3 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {r.evaluation.score >= 4 ? "✅" :
                   r.evaluation.score === 3 ? "🟡" : "❌"} {r.evaluation.score}/5
                </span>
              </div>

              {/* Question text */}
              <p className="text-sm text-light-text dark:text-dark-text mb-3 font-medium">
                {r.question}
              </p>

              {/* Your answer */}
              <div className="bg-light-bg dark:bg-dark-bg rounded-lg px-3 py-2 mb-2">
                <p className="text-xs text-gray-400">Your answer:</p>
                <p className="text-sm text-light-text dark:text-dark-text mt-0.5">
                  {r.userAnswer}
                </p>
              </div>

              {/* Correct answer (if wrong) */}
              {r.evaluation.score < 4 && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2 mb-2">
                  <p className="text-xs text-gray-400">Correct answer:</p>
                  <p className="text-sm text-green-400 mt-0.5">{r.correctAnswer}</p>
                </div>
              )}

              {/* AI Feedback */}
              <p className="text-sm text-gray-400 mt-2">{r.evaluation.feedback}</p>

              {/* Hint */}
              {r.evaluation.hint && (
                <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-yellow-400">
                    💡 {r.evaluation.hint}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/review")}
            className="btn-primary flex-1"
          >
            Back to Review
          </button>
          <button
            onClick={() => navigate("/progress")}
            className="btn-secondary flex-1"
          >
            View Progress
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz Screen ───────────────────────────────────────────────────────────
  const question = questions[currentIdx];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-light-text dark:text-dark-text">
            {concept?.title}
          </h1>
          <p className="text-sm text-gray-400">
            Question {currentIdx + 1} of {questions.length}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                i < answers.length
                  ? "bg-primary"
                  : i === currentIdx
                  ? "bg-primary/50 ring-2 ring-primary/30"
                  : "bg-gray-300 dark:bg-dark-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Answered count */}
      {answers.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full" />
          <p className="text-sm text-primary">
            {answers.length} answer{answers.length > 1 ? "s" : ""} saved —{" "}
            {questions.length - answers.length} remaining
          </p>
        </div>
      )}

      {/* Question card */}
      <div className="card mb-4">
        {/* Type badge */}
        <span className={`text-xs px-2 py-1 rounded-full font-medium mb-4 inline-block ${
          question?.type === "mcq"       ? "bg-blue-500/10 text-blue-400"     :
          question?.type === "fillblank" ? "bg-purple-500/10 text-purple-400" :
          "bg-orange-500/10 text-orange-400"
        }`}>
          {question?.type === "mcq"       ? "Multiple Choice" :
           question?.type === "fillblank" ? "Fill in the Blank" : "Coding"}
        </span>

        <p className="text-light-text dark:text-dark-text font-medium mb-6 leading-relaxed">
          {question?.question}
        </p>

        {/* MCQ Options */}
        {question?.type === "mcq" && (
          <div className="space-y-2">
            {question.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => setUserAnswer(opt)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all duration-200 text-sm ${
                  userAnswer === opt
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-light-border dark:border-dark-border text-gray-400 hover:border-primary/50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Text / Coding Input */}
        {(question?.type === "fillblank" || question?.type === "coding") && (
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder={
              question?.type === "fillblank"
                ? "Type the missing word or phrase..."
                : "Write your code here..."
            }
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
          />
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mt-4">
            {error}
          </div>
        )}

        {/* Next / Submit button */}
        <button
          onClick={handleNext}
          disabled={!userAnswer.trim()}
          className="btn-primary w-full mt-4"
        >
          {currentIdx + 1 < questions.length
            ? `Save & Next →  (${currentIdx + 2}/${questions.length})`
            : "Submit All Answers 🧠"}
        </button>

        <p className="text-center text-xs text-gray-400 mt-2">
          {currentIdx + 1 < questions.length
            ? "Your answer will be saved and evaluated at the end"
            : "AI will evaluate all your answers together"}
        </p>
      </div>
    </div>
  );
};

export default QuizPage;
