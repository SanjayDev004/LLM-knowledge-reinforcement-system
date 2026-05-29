const Video  = require("../models/Video");
const User   = require("../models/User");
const { fetchYoutubeTranscript } = require("../services/youtubeService");
const { extractTextFromPDF }     = require("../services/pdfService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

// ── YouTube Input ─────────────────────────────────────────────────────────────
const submitYoutube = async (req, res) => {
  try {
    const { url, title, tags } = req.body;

    const { videoId, transcript } = await fetchYoutubeTranscript(url);

    const video = await Video.create({
      userId:         req.user._id,
      sourceType:     "youtube",
      youtubeUrl:     url,
      youtubeVideoId: videoId,
      title:          title || `YouTube Video — ${videoId}`,
      tags:           tags  || [],
      rawText:        transcript,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalVideosAdded: 1 } });

    sendSuccess(res, 201, "YouTube transcript fetched and saved successfully", {
      video: {
        _id:         video._id,
        sourceType:  video.sourceType,
        title:       video.title,
        tags:        video.tags,
        isProcessed: video.isProcessed,
        createdAt:   video.createdAt,
        textPreview: transcript.substring(0, 300) + "...",
        totalLength: transcript.length,
      },
    });
  } catch (error) {
    console.error("YouTube Input Error:", error.message);
    sendError(res, 400, error.message);
  }
};

// ── Text Input ────────────────────────────────────────────────────────────────
const submitText = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    const video = await Video.create({
      userId:     req.user._id,
      sourceType: "text",
      title,
      tags:       tags || [],
      rawText:    content,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalVideosAdded: 1 } });

    sendSuccess(res, 201, "Notes saved successfully", {
      video: {
        _id:         video._id,
        sourceType:  video.sourceType,
        title:       video.title,
        tags:        video.tags,
        isProcessed: video.isProcessed,
        createdAt:   video.createdAt,
        totalLength: content.length,
      },
    });
  } catch (error) {
    console.error("Text Input Error:", error.message);
    sendError(res, 500, "Failed to save notes — please try again");
  }
};

// ── PDF Input ─────────────────────────────────────────────────────────────────
const submitPDF = async (req, res) => {
  try {
    if (!req.file) return sendError(res, 400, "No PDF file uploaded");

    const { title, tags } = req.body;
    const extractedText   = await extractTextFromPDF(req.file.buffer);

    const video = await Video.create({
      userId:      req.user._id,
      sourceType:  "pdf",
      pdfFileName: req.file.originalname,
      title:       title || req.file.originalname.replace(".pdf", ""),
      tags:        tags ? JSON.parse(tags) : [],
      rawText:     extractedText,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { totalVideosAdded: 1 } });

    sendSuccess(res, 201, "PDF uploaded and text extracted successfully", {
      video: {
        _id:         video._id,
        sourceType:  video.sourceType,
        pdfFileName: video.pdfFileName,
        title:       video.title,
        isProcessed: video.isProcessed,
        createdAt:   video.createdAt,
        textPreview: extractedText.substring(0, 300) + "...",
        totalLength: extractedText.length,
      },
    });
  } catch (error) {
    console.error("PDF Input Error:", error.message);
    sendError(res, 400, error.message);
  }
};

// ── Get All Inputs ────────────────────────────────────────────────────────────
const getAllInputs = async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.user._id })
      .select("-rawText")
      .sort({ createdAt: -1 });
    sendSuccess(res, 200, "Inputs fetched successfully", { count: videos.length, videos });
  } catch (error) {
    sendError(res, 500, "Failed to fetch inputs");
  }
};

// ── Get Single Input ──────────────────────────────────────────────────────────
const getInputById = async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, userId: req.user._id });
    if (!video) return sendError(res, 404, "Input not found");
    sendSuccess(res, 200, "Input fetched successfully", { video });
  } catch (error) {
    sendError(res, 500, "Failed to fetch input");
  }
};

// ── Delete Input ──────────────────────────────────────────────────────────────
const deleteInput = async (req, res) => {
  try {
    const video = await Video.findOne({ _id: req.params.id, userId: req.user._id });
    if (!video) return sendError(res, 404, "Input not found");
    await video.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalVideosAdded: -1 } });
    sendSuccess(res, 200, "Input deleted successfully");
  } catch (error) {
    sendError(res, 500, "Failed to delete input");
  }
};

module.exports = { submitYoutube, submitText, submitPDF, getAllInputs, getInputById, deleteInput };
