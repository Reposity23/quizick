import fs from "node:fs";
import type { Express } from "express";
import { getXaiClient } from "../xaiClient";
import { extractResponseText } from "./textExtract";
import { buildGrokSystemPrompt, buildGrokUserPrompt } from "./promptBuilder";
import { quizSchema, schemaJsonString, type QuizType } from "./quizSchema";

export async function generateQuizFromFiles(params: {
  files: Express.Multer.File[];
  quizType: QuizType;
  questionCount: number;
  difficulty?: "easy" | "medium" | "hard";
}) {
  const client = getXaiClient();

  const uploaded = await Promise.all(params.files.map(async (file) => {
    const created = await client.files.create({
      file: fs.createReadStream(file.path),
      purpose: "assistants"
    });
    return created.id;
  }));

  const userPrompt = buildGrokUserPrompt({
    quizType: params.quizType,
    questionCount: params.questionCount,
    difficulty: params.difficulty,
    schemaString: schemaJsonString()
  });

  const response = await client.responses.create({
    model: "grok-4-1-fast-non-reasoning",
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: buildGrokSystemPrompt() }]
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: userPrompt },
          ...uploaded.map((fileId) => ({ type: "input_file" as const, file_id: fileId }))
        ]
      }
    ],
    store: false
  });

  const rawText = extractResponseText(response);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      ok: false as const,
      error: "Invalid JSON or schema mismatch",
      raw: rawText,
      details: "Failed to parse JSON from Grok output"
    };
  }

  const validated = quizSchema.safeParse(parsed);
  if (!validated.success) {
    return {
      ok: false as const,
      error: "Invalid JSON or schema mismatch",
      raw: rawText,
      details: JSON.stringify(validated.error.format(), null, 2)
    };
  }

  return {
    ok: true as const,
    quiz: validated.data,
    raw: rawText
  };
}
