const axios = require("axios");
const http = require("http");
const https = require("https");

const httpAgent = new http.Agent({ family: 4 });
const httpsAgent = new https.Agent({ family: 4 });

const OLLAMA_URL = `${process.env.QWEN_BASE_URL}/api/generate`;
const MODEL = process.env.QWEN_MODEL || "qwen2.5:3b";

// ── Call Ollama ───────────────────────────────────────────────────────────────
const callLLM = async (prompt, forceJson = true) => {
  const body = {
    model: MODEL,
    prompt: prompt,
    stream: false,
    temperature: 0.2,
  };

  if (forceJson) {
    body.format = "json";
  }

  const response = await axios.post(OLLAMA_URL, body, {
    httpAgent,
    httpsAgent,
    timeout: 120000,
  });

  return response.data.response;
};

// ── Helper: Extract clean JSON ────────────────────────────────────────────────
const parseJSON = (text) => {
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const firstBracket = Math.min(
    cleaned.indexOf("[") === -1 ? Infinity : cleaned.indexOf("["),
    cleaned.indexOf("{") === -1 ? Infinity : cleaned.indexOf("{")
  );
  const lastBracket = Math.max(
    cleaned.lastIndexOf("]"),
    cleaned.lastIndexOf("}")
  );

  if (firstBracket === Infinity || lastBracket === -1) {
    throw new Error("No JSON found in LLM response");
  }

  return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
};

// ── Helper: Extract array from object or direct array ─────────────────────────
const extractArray = (parsed) => {
  if (Array.isArray(parsed)) return parsed;
  for (const key of Object.keys(parsed)) {
    if (Array.isArray(parsed[key])) return parsed[key];
  }
  return [];
};

// ── Generate Summary ──────────────────────────────────────────────────────────
const generateSummary = async (rawText) => {
  const prompt =
    `You are a programming tutor. Summarize this programming tutorial.\n\n` +
    `TEXT:\n"""\n${rawText.substring(0, 6000)}\n"""\n\n` +
    `Write a summary in 4 to 6 clear sentences.\n` +
    `Focus on what was taught. Write simply. No bullet points.\n\n` +
    `Return a JSON object:\n` +
    `{"summary": "your full summary here"}`;

  const raw = await callLLM(prompt, true);

  let parsed;
  try {
    parsed = parseJSON(raw);
  } catch {
    return raw.trim();
  }

  return parsed.summary || parsed[Object.keys(parsed)[0]] || raw;
};

// ── Extract Concepts ──────────────────────────────────────────────────────────
const extractConcepts = async (rawText) => {
  const prompt =
    `You are a programming tutor. Read this tutorial carefully and extract the key programming concepts.\n\n` +
    `TEXT:\n"""\n${rawText.substring(0, 8000)}\n"""\n\n` +
    `Return a JSON object with a concepts array.\n` +
    `Each concept must be directly from the text above — do NOT invent concepts.\n\n` +
    `{\n` +
    `  "concepts": [\n` +
    `    {\n` +
    `      "title": "exact concept name from the text",\n` +
    `      "explanation": "clear explanation in 2-3 sentences for a beginner",\n` +
    `      "difficulty": "easy"\n` +
    `    }\n` +
    `  ]\n` +
    `}\n\n` +
    `Rules:\n` +
    `- Extract exactly 5 to 8 concepts\n` +
    `- difficulty must be exactly one of: easy, medium, hard\n` +
    `- Only include concepts actually mentioned in the text\n` +
    `- Do NOT copy these example values — write real concept names and explanations`;

  const raw = await callLLM(prompt, true);
  console.log("🔍 Raw concepts response:", raw.substring(0, 300));

  let parsed;
  try {
    parsed = parseJSON(raw);
  } catch (err) {
    console.error("❌ Concept JSON parse error:\n", raw);
    throw new Error("LLM returned invalid JSON for concepts — try again");
  }

  const concepts = extractArray(parsed);

  if (!concepts || concepts.length === 0) {
    console.error("❌ No concepts array found. Parsed:", JSON.stringify(parsed));
    throw new Error("No concepts returned — try with longer content");
  }

  return concepts.map((c) => ({
    title: c.title || "Untitled Concept",
    explanation: c.explanation || "",
    difficulty: ["easy", "medium", "hard"].includes(c.difficulty) ? c.difficulty : "medium",
  }));
};

// ── Generate Questions ────────────────────────────────────────────────────────
const generateQuestions = async (concept) => {
  const prompt =
    `You are a programming tutor. Generate exactly 3 quiz questions for this concept.\n\n` +
    `CONCEPT: "${concept.title}"\n` +
    `EXPLANATION: "${concept.explanation}"\n` +
    `DIFFICULTY: "${concept.difficulty}"\n\n` +
    `Return a JSON object with a questions array:\n` +
    `{\n` +
    `  "questions": [\n` +
    `    {\n` +
    `      "type": "mcq",\n` +
    `      "question": "A real question about ${concept.title}",\n` +
    `      "options": ["A) real option", "B) real option", "C) real option", "D) real option"],\n` +
    `      "answer": "A) real option",\n` +
    `      "explanation": "real explanation"\n` +
    `    },\n` +
    `    {\n` +
    `      "type": "fillblank",\n` +
    `      "question": "A real fill in the blank about ${concept.title} with _____ in it.",\n` +
    `      "options": [],\n` +
    `      "answer": "real answer word",\n` +
    `      "explanation": "real explanation"\n` +
    `    },\n` +
    `    {\n` +
    `      "type": "coding",\n` +
    `      "question": "Write real code related to ${concept.title}",\n` +
    `      "options": [],\n` +
    `      "answer": "real code answer",\n` +
    `      "explanation": "real explanation"\n` +
    `    }\n` +
    `  ]\n` +
    `}\n\n` +
    `STRICT RULES:\n` +
    `- Write REAL questions about "${concept.title}" — do NOT copy the example text\n` +
    `- Question 1 type MUST be exactly "mcq" with 4 real options\n` +
    `- Question 2 type MUST be exactly "fillblank" with _____ in the question\n` +
    `- Question 3 type MUST be exactly "coding" with a real coding task\n` +
    `- Do NOT use placeholder text like "do X" or "option1"\n` +
    `- All questions must be specifically about: ${concept.title}`;

  const raw = await callLLM(prompt, true);
  console.log(`🔍 Raw questions for "${concept.title}":`, raw.substring(0, 300));

  let parsed;
  try {
    parsed = parseJSON(raw);
  } catch (err) {
    console.error(`❌ Question JSON parse error for "${concept.title}":\n`, raw);
    return [];
  }

  const questions = extractArray(parsed);
  if (!Array.isArray(questions) || questions.length === 0) return [];

  // Force correct types by position — safety net even if Qwen ignores instructions
  const expectedTypes = ["mcq", "fillblank", "coding"];

  return questions.slice(0, 3).map((q, index) => ({
    type: expectedTypes[index],
    question: q.question || "",
    options: expectedTypes[index] === "mcq" ? (q.options || []) : [],
    answer: q.answer || "",
    explanation: q.explanation || "",
    difficulty: concept.difficulty,
  }));
};

// ── Evaluate Student Answer (Phase 5) ────────────────────────────────────────
const evaluateAnswer = async (question, correctAnswer, studentAnswer) => {

  const student = studentAnswer.trim();
  const correct = correctAnswer.trim();

  // ── Hard Rule 1: Empty or nonsense ───────────────────────────────────────
  if (student.length < 1) {
    return {
      score: 0, verdict: "wrong",
      feedback: "No answer provided.",
      hint: "Please write a proper answer.",
    };
  }

  const nonsensePattern = /^(.)\1{2,}$|^(kk+|aaa+|zzz+|asdf|qwerty|lol|idk|hmm|ok|no|yes|hi|hello)$/i;
  if (nonsensePattern.test(student.toLowerCase()) && student.length < 6) {
    return {
      score: 0, verdict: "wrong",
      feedback: `"${student}" is not a valid answer.`,
      hint: "Write a genuine answer.",
    };
  }

  // ── Hard Rule 2: Exact match (case insensitive) ───────────────────────────
  if (student.toLowerCase() === correct.toLowerCase()) {
    return {
      score: 5, verdict: "correct",
      feedback: "Perfect! Your answer matches exactly.",
      hint: "",
    };
  }

  // ── Hard Rule 3: Fillblank — fuzzy word match ─────────────────────────────
  // If correct answer is short (1-3 words) check if student contains it
  const correctWords = correct.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const studentLower = student.toLowerCase();

  if (correctWords.length <= 3) {
    const allMatch = correctWords.every(w =>
      studentLower.includes(w) ||
      // handle minor typos — check if 80% of chars match
      [...studentLower.split(/\s+/)].some(sw => {
        if (Math.abs(sw.length - w.length) > 2) return false;
        let matches = 0;
        for (let i = 0; i < Math.min(sw.length, w.length); i++) {
          if (sw[i] === w[i]) matches++;
        }
        return matches / w.length >= 0.8;
      })
    );

    if (allMatch) {
      return {
        score: 5, verdict: "correct",
        feedback: `Correct! "${student}" is the right answer.`,
        hint: "",
      };
    }
  }

  // ── Hard Rule 4: Coding — structural similarity check ────────────────────
  // Remove whitespace, variable names, string values and compare structure
  const normalizeCode = (code) => code
    .toLowerCase()
    .replace(/['"]/g, "")           // remove quotes
    .replace(/\s+/g, "")            // remove whitespace
    .replace(/[a-z_][a-z0-9_]*/g, (match) => {
      // keep keywords, replace variable names with placeholder
      const keywords = ["def", "return", "for", "in", "if", "else", "print",
        "len", "range", "while", "class", "import", "from",
        "true", "false", "none", "and", "or", "not", "dict",
        "list", "set", "tuple", "int", "str", "float"];
      return keywords.includes(match) ? match : "VAR";
    });

  const studentNorm = normalizeCode(student);
  const correctNorm = normalizeCode(correct);

  // Check for key structural elements
  const codeKeywords = ["{", "}", ":", "[", "]", "(", ")", "=", "print", "def", "return"];
  const correctHasKeywords = codeKeywords.filter(k => correctNorm.includes(k));
  const studentHasKeywords = correctHasKeywords.filter(k => studentNorm.includes(k));
  const keywordMatchRatio = correctHasKeywords.length > 0
    ? studentHasKeywords.length / correctHasKeywords.length
    : 0;

  // If student code has 70%+ of structural keywords → likely correct
  if (keywordMatchRatio >= 0.7 && student.length > 10) {
    return {
      score: 4, verdict: "correct",
      feedback: "Good answer! Your code structure is correct.",
      hint: "",
    };
  }

  // If student code has 40-70% → partial
  if (keywordMatchRatio >= 0.4 && student.length > 5) {
    return {
      score: 3, verdict: "partial",
      feedback: "You are on the right track but your answer is missing some parts.",
      hint: `Look at this for reference: ${correctAnswer}`,
    };
  }

  // ── Last resort: Call LLM with very strict prompt ─────────────────────────
  const prompt =
    `You are a strict programming evaluator.\n\n` +
    `QUESTION: "${question}"\n` +
    `CORRECT ANSWER: "${correctAnswer}"\n` +
    `STUDENT ANSWER: "${student}"\n\n` +
    `STRICT RULES:\n` +
    `- If student answer means the same thing as correct answer → score 4 or 5\n` +
    `- If student used different variable names but same logic → score 4\n` +
    `- If student answer is completely wrong → score 0 or 1\n` +
    `- Different variable names do NOT make an answer wrong\n` +
    `- Different string values do NOT make an answer wrong\n\n` +
    `Return ONLY this JSON:\n` +
    `{"score": 0, "verdict": "wrong", "feedback": "explanation", "hint": "hint if score < 4"}`;

  const raw = await callLLM(prompt, true);

  try {
    const result = parseJSON(raw);
    if (result.score >= 4) result.verdict = "correct";
    else if (result.score === 3) result.verdict = "partial";
    else result.verdict = "wrong";
    return result;
  } catch {
    return {
      score: 0, verdict: "wrong",
      feedback: "Could not evaluate — please try again",
      hint: "",
    };
  }
};





module.exports = {
  generateSummary,
  extractConcepts,
  generateQuestions,
  evaluateAnswer,
};
