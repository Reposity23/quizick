import express from "express";
import cors from "cors";
import path from "node:path";
import { generateQuizRouter } from "./routes/generateQuiz";

const app = express();
const port = Number(process.env.PORT) || 3001;
const webDistPath = path.resolve(process.cwd(), "web", "dist");

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "quizforge-prototype" });
});

app.use("/api", generateQuizRouter);
app.use(express.static(webDistPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  return res.sendFile(path.join(webDistPath, "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`QuizForge server listening on ${port}`);
});
