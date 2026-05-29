import { useState } from "react";
import api from "../api/axios";

const tabs = ["🔗 YouTube URL", "✍️ Text / Notes", "📄 PDF Upload"];


const StepProgress = ({ steps, currentStep, title }) => (
  <div className="min-h-screen dark:bg-dark-bg flex items-center justify-center px-4">
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="text-5xl">🧠</span>
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mt-4">
          {title}
        </h2>
        <p className="text-gray-400 mt-2 text-sm">Please wait while we process your content</p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const status =
            index < currentStep ? "done" :
            index === currentStep ? "active" : "pending";

          return (
            <div
              key={index}
              className={`card flex items-center gap-4 transition-all duration-500 ${
                status === "active"  ? "border-primary/50 bg-primary/5 scale-[1.02]" :
                status === "done"    ? "border-green-500/30 bg-green-500/5 opacity-80" :
                "opacity-40"
              }`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                status === "done"   ? "bg-green-500/20" :
                status === "active" ? "bg-primary/20"   :
                "bg-gray-500/10"
              }`}>
                {status === "done" ? "✅" : status === "active" ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : step.icon}
              </div>

              {/* Text */}
              <div className="flex-1">
                <p className={`font-semibold text-sm ${
                  status === "done"   ? "text-green-400" :
                  status === "active" ? "text-primary"   :
                  "text-gray-400"
                }`}>
                  {step.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{step.description}</p>
              </div>

              {/* Status text */}
              <div className="text-xs font-medium shrink-0">
                {status === "done"   && <span className="text-green-400">Done</span>}
                {status === "active" && <span className="text-primary animate-pulse">In progress...</span>}
                {status === "pending" && <span className="text-gray-500">Waiting</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tip */}
      <p className="text-center text-xs text-gray-400 mt-8">
        💡 AI processing may take 2-3 minutes — please keep this tab open
      </p>
    </div>
  </div>
);


const SuccessScreen = ({ result, onAddMore }) => (
  <div className="min-h-screen dark:bg-dark-bg flex items-center justify-center px-4">
    <div className="w-full max-w-lg text-center">
      <div className="card">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-2">
          All Done!
        </h2>
        <p className="text-gray-400 mb-6">Your content has been processed successfully</p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-light-bg dark:bg-dark-bg rounded-xl p-4">
            <p className="text-3xl font-bold text-primary">{result.conceptsCount}</p>
            <p className="text-sm text-gray-400 mt-1">Concepts extracted</p>
          </div>
          <div className="bg-light-bg dark:bg-dark-bg rounded-xl p-4">
            <p className="text-3xl font-bold text-primary">{result.questionsCount}</p>
            <p className="text-sm text-gray-400 mt-1">Questions generated</p>
          </div>
        </div>

        {/* Summary */}
        {result.summary && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-primary font-semibold mb-2">📋 AI Summary</p>
            <p className="text-sm text-gray-400 leading-relaxed">{result.summary}</p>
          </div>
        )}

        {/* Concepts preview */}
        {result.concepts && result.concepts.length > 0 && (
          <div className="text-left mb-6">
            <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wide">
              Concepts ready for review:
            </p>
            <div className="space-y-2">
              {result.concepts.slice(0, 5).map((c, i) => (
                <div key={c._id} className="flex items-center gap-2">
                  <span className="text-primary text-sm">→</span>
                  <span className="text-sm text-light-text dark:text-dark-text">{c.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
                    c.difficulty === "easy"   ? "bg-green-500/10 text-green-400"  :
                    c.difficulty === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>
                    {c.difficulty}
                  </span>
                </div>
              ))}
              {result.concepts.length > 5 && (
                <p className="text-xs text-gray-400 pl-4">
                  +{result.concepts.length - 5} more concepts...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={onAddMore} className="btn-secondary flex-1">
            Add More Content
          </button>
          <a href="/review" className="btn-primary flex-1 text-center">
            Start Review →
          </a>
        </div>
      </div>
    </div>
  </div>
);


const AddContent = () => {
  const [activeTab,    setActiveTab]    = useState(0);
  const [processing,   setProcessing]   = useState(false);
  const [currentStep,  setCurrentStep]  = useState(0);
  const [progressSteps, setProgressSteps] = useState([]);
  const [progressTitle, setProgressTitle] = useState("");
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState("");

  const [ytForm,   setYtForm]   = useState({ url: "", title: "" });
  const [textForm, setTextForm] = useState({ title: "", content: "" });
  const [pdfForm,  setPdfForm]  = useState({ title: "" });
  const [pdfFile,  setPdfFile]  = useState(null);

  const youtubeSteps = [
    { icon: "🔗", label: "Validating YouTube URL",       description: "Checking if the video is accessible" },
    { icon: "⬇️", label: "Downloading audio",            description: "yt-dlp extracting audio from video" },
    { icon: "🎙️", label: "Transcribing with Whisper AI", description: "Converting speech to text (1-2 mins)" },
    { icon: "💾", label: "Saving transcript",            description: "Storing raw text to database" },
    { icon: "🧠", label: "Extracting concepts",          description: "Qwen AI analyzing your content" },
    { icon: "❓", label: "Generating quiz questions",    description: "Creating MCQ, fill-blank and coding questions" },
    { icon: "✅", label: "All done",                     description: "Your content is ready for review" },
  ];

  const textSteps = [
    { icon: "📝", label: "Saving your notes",         description: "Storing content to database" },
    { icon: "🧠", label: "Extracting concepts",       description: "Qwen AI analyzing your content" },
    { icon: "❓", label: "Generating quiz questions", description: "Creating MCQ, fill-blank and coding questions" },
    { icon: "✅", label: "All done",                  description: "Your content is ready for review" },
  ];

  const pdfSteps = [
    { icon: "📄", label: "Uploading PDF",             description: "Sending file to server" },
    { icon: "🔍", label: "Extracting text",           description: "pdf-parse reading document content" },
    { icon: "🧠", label: "Extracting concepts",       description: "Qwen AI analyzing your content" },
    { icon: "❓", label: "Generating quiz questions", description: "Creating MCQ, fill-blank and coding questions" },
    { icon: "✅", label: "All done",                  description: "Your content is ready for review" },
  ];

  
  const processWithAI = async (videoId, steps, conceptStepIndex) => {
    setCurrentStep(conceptStepIndex);
    const res = await api.post(`/llm/process/${videoId}`);
    setCurrentStep(conceptStepIndex + 1);
    await new Promise(r => setTimeout(r, 800));
    setCurrentStep(steps.length); // all done
    return res.data.data;
  };

  const submitYoutube = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setProcessing(true);
    setProgressSteps(youtubeSteps);
    setProgressTitle("Processing YouTube Video");
    setCurrentStep(0);

    try {
      // Step 0 → validating
      await new Promise(r => setTimeout(r, 600));
      setCurrentStep(1);

      // Step 1-3 → download + transcribe (actual API call)
      const inputRes = await api.post("/input/youtube", ytForm);
      const videoId  = inputRes.data.data.video._id;
      setCurrentStep(3);
      await new Promise(r => setTimeout(r, 400));
      setCurrentStep(4); // saving

      // Step 4-6 → AI processing
      const llmResult = await processWithAI(videoId, youtubeSteps, 4);
      setResult(llmResult);
    } catch (err) {
      setError(err.response?.data?.message || "Failed — please try again");
      setProcessing(false);
    }
  };

  const submitText = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setProcessing(true);
    setProgressSteps(textSteps);
    setProgressTitle("Processing Your Notes");
    setCurrentStep(0);

    try {
      // Step 0 → saving notes
      const inputRes = await api.post("/input/text", textForm);
      const videoId  = inputRes.data.data.video._id;
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 500));

      // Step 1-3 → AI processing
      const llmResult = await processWithAI(videoId, textSteps, 1);
      setResult(llmResult);
    } catch (err) {
      setError(err.response?.data?.message || "Failed — please try again");
      setProcessing(false);
    }
  };

  // ── Submit PDF ──────────────────────────────────────────────────────────────
  const submitPDF = async (e) => {
    e.preventDefault();
    if (!pdfFile) { setError("Please select a PDF file"); return; }
    setError("");
    setResult(null);
    setProcessing(true);
    setProgressSteps(pdfSteps);
    setProgressTitle("Processing PDF Document");
    setCurrentStep(0);

    try {
      // Step 0 → uploading
      const formData = new FormData();
      formData.append("pdf",   pdfFile);
      formData.append("title", pdfForm.title || pdfFile.name.replace(".pdf", ""));
      const inputRes = await api.post("/input/pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const videoId = inputRes.data.data.video._id;
      setCurrentStep(1);
      await new Promise(r => setTimeout(r, 500));
      setCurrentStep(2); // extracting text done

      // Step 2-4 → AI processing
      const llmResult = await processWithAI(videoId, pdfSteps, 2);
      setResult(llmResult);
    } catch (err) {
      setError(err.response?.data?.message || "Failed — please try again");
      setProcessing(false);
    }
  };

  // ── Show progress screen ────────────────────────────────────────────────────
  if (processing && !result) {
    return (
      <StepProgress
        steps={progressSteps}
        currentStep={currentStep}
        title={progressTitle}
      />
    );
  }

  // ── Show success screen ─────────────────────────────────────────────────────
  if (result) {
    return (
      <SuccessScreen
        result={result}
        onAddMore={() => {
          setResult(null);
          setProcessing(false);
          setCurrentStep(0);
          setYtForm({ url: "", title: "" });
          setTextForm({ title: "", content: "" });
          setPdfForm({ title: "" });
          setPdfFile(null);
        }}
      />
    );
  }

  // ── Normal form ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="page-title">Add Content</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-light-bg dark:bg-dark-bg p-1 rounded-xl">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(i); setError(""); }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === i
                ? "bg-primary text-dark-bg shadow"
                : "text-gray-400 hover:text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Form Card */}
      <div className="card">

        {/* YouTube Tab */}
        {activeTab === 0 && (
          <form onSubmit={submitYoutube} className="space-y-4">
            <div>
              <label className="label">YouTube URL</label>
              <input
                type="url"
                className="input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={ytForm.url}
                onChange={(e) => setYtForm({ ...ytForm, url: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Title (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. React useEffect Hook"
                value={ytForm.title}
                onChange={(e) => setYtForm({ ...ytForm, title: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-400">
              ⏳ Audio will be downloaded and transcribed by Whisper — takes 1-2 minutes.
            </p>
            <button type="submit" className="btn-primary w-full">
              Fetch Transcript →
            </button>
          </form>
        )}

        {/* Text Tab */}
        {activeTab === 1 && (
          <form onSubmit={submitText} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. React Hooks Notes"
                value={textForm.title}
                onChange={(e) => setTextForm({ ...textForm, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">What did you learn today?</label>
              <textarea
                className="input min-h-[200px] resize-y"
                placeholder="Type or paste your notes here... (minimum 50 characters)"
                value={textForm.content}
                onChange={(e) => setTextForm({ ...textForm, content: e.target.value })}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                {textForm.content.length} characters
              </p>
            </div>
            <button type="submit" className="btn-primary w-full">
              Save Notes →
            </button>
          </form>
        )}

        {/* PDF Tab */}
        {activeTab === 2 && (
          <form onSubmit={submitPDF} className="space-y-4">
            <div>
              <label className="label">Title (optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Node.js Cheat Sheet"
                value={pdfForm.title}
                onChange={(e) => setPdfForm({ ...pdfForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="label">PDF File</label>
              <div
                className="border-2 border-dashed border-light-border dark:border-dark-border rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => document.getElementById("pdf-input").click()}
              >
                {pdfFile ? (
                  <div>
                    <p className="text-primary font-medium">📄 {pdfFile.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-4xl mb-2">📄</p>
                    <p className="text-gray-400">Click to select a PDF file</p>
                    <p className="text-xs text-gray-400 mt-1">Max size: 10MB</p>
                  </div>
                )}
              </div>
              <input
                id="pdf-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setPdfFile(e.target.files[0])}
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Upload PDF →
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AddContent;
