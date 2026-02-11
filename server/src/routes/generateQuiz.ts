import { Router, type ErrorRequestHandler } from "express";
import multer from "multer";
import { uploadMiddleware } from "../services/fileUpload";
import { cleanupTempFiles } from "../services/tempCleanup";
import { generateQuizFromFiles } from "../services/grokGenerate";
import type { QuizType } from "../services/quizSchema";

const quizTypes: QuizType[] = ["mcq", "fill_blank", "identification", "matching", "mixed"];
const difficulties = ["easy", "medium", "hard"] as const;

export const generateQuizRouter = Router();

generateQuizRouter.post("/generate-quiz", uploadMiddleware.array("files", 10), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) ?? [];
  const questionCount = Number(req.body.questionCount);
  const quizType = req.body.quizType as QuizType;
  const difficulty = req.body.difficulty as (typeof difficulties)[number] | undefined;

  if (!files.length) {
    return res.status(400).json({ ok: false, error: "Please upload at least one file." });
  }
  if (!quizTypes.includes(quizType)) {
    return res.status(400).json({ ok: false, error: "Invalid quizType." });
  }
  if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 100) {
    return res.status(400).json({ ok: false, error: "questionCount must be an integer between 1 and 100." });
  }
  if (difficulty && !difficulties.includes(difficulty)) {
    return res.status(400).json({ ok: false, error: "difficulty must be easy, medium, or hard." });
  }

  try {
    const result = await generateQuizFromFiles({ files, quizType, questionCount, difficulty });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return res.status(500).json({ ok: false, error: message });
  } finally {
    await cleanupTempFiles(files.map((file) => file.path));
  }
});

const uploadErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ ok: false, error: "File too large. Maximum allowed size is 20MB per file." });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ ok: false, error: "Too many files. Maximum is 10 files per request." });
    }
    return res.status(400).json({ ok: false, error: `Upload error: ${error.message}` });
  }
  return res.status(500).json({ ok: false, error: "Unexpected upload error." });
};

generateQuizRouter.use(uploadErrorHandler);
