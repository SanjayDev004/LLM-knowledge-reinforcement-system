const { spawn } = require("child_process");
const path      = require("path");
const fs        = require("fs");
const os        = require("os");

const extractVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    /(?:youtube\.com\/shorts\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const fetchYoutubeTranscript = (url) => {
  return new Promise((resolve, reject) => {
    const videoId = extractVideoId(url);

    if (!videoId) {
      return reject(new Error("Invalid YouTube URL — paste a valid youtube.com or youtu.be link"));
    }

    console.log(`\n🎬 Starting transcription for video: ${videoId}`);
    console.log("⏳ Downloading audio + running Whisper... (may take 1-2 mins)");

    // Use a temp file to get the result — avoids stdout mixing problem
    const resultFile = path.join(os.tmpdir(), `transcript_${videoId}_${Date.now()}.json`);
    const scriptPath = path.join(__dirname, "transcribe.py");

    const python = spawn("python", [scriptPath, url, resultFile]);

    // Show Python progress in Node terminal
    python.stdout.on("data", (data) => process.stdout.write(data));
    python.stderr.on("data", (data) => process.stdout.write(data));

    python.on("close", (code) => {
      console.log(`\n🐍 Python exited with code: ${code}`);

      // Check if result file was created
      if (!fs.existsSync(resultFile)) {
        return reject(new Error("Transcription failed — no result file created"));
      }

      try {
        // Read the result from file
        const raw    = fs.readFileSync(resultFile, "utf-8");
        const result = JSON.parse(raw);

        // Clean up temp file
        fs.unlinkSync(resultFile);

        if (!result.success) {
          return reject(new Error(result.error || "Transcription failed"));
        }

        if (!result.transcript || result.transcript.length < 30) {
          return reject(new Error("Transcript is empty after processing"));
        }

        console.log(`✅ Transcription complete — ${result.transcript.length} characters`);
        resolve({ videoId, transcript: result.transcript });

      } catch (err) {
        // Clean up temp file if exists
        if (fs.existsSync(resultFile)) {
          fs.unlinkSync(resultFile);
        }
        console.error("❌ Failed to read result file:", err.message);
        reject(new Error("Failed to read transcription result"));
      }
    });

    python.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(new Error("Python not found — make sure Python is installed and in PATH"));
      } else {
        reject(new Error("Failed to start Python: " + err.message));
      }
    });
  });
};

module.exports = { fetchYoutubeTranscript, extractVideoId };
