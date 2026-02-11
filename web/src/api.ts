export type QuizType = "mcq" | "fill_blank" | "identification" | "matching" | "mixed";

export type MCQQuestion = {
  id: string;
  type: "mcq";
  prompt: string;
  choices: string[];
  answer_index: number;
  explanation: string;
};

export type FillBlankQuestion = {
  id: string;
  type: "fill_blank";
  prompt: string;
  answers: string[];
  explanation: string;
};

export type IdentificationQuestion = {
  id: string;
  type: "identification";
  prompt: string;
  answers: string[];
  explanation: string;
};

export type MatchingQuestion = {
  id: string;
  type: "matching";
  pairs: { left: string; right: string }[];
  explanation: string;
};

export type QuizQuestion = MCQQuestion | FillBlankQuestion | IdentificationQuestion | MatchingQuestion;

export type QuizPayload = {
  quiz_title: string;
  quiz_type: QuizType;
  question_count: number;
  source_summary: string;
  questions: QuizQuestion[];
};

export type GenerateResponse =
  | { ok: true; quiz: QuizPayload; raw: string }
  | { ok: false; error: string; raw?: string; details?: string };

export async function generateQuizRequest(formData: FormData): Promise<GenerateResponse> {
  const response = await fetch("/api/generate-quiz", {
    method: "POST",
    body: formData
  });

  const json = (await response.json()) as GenerateResponse;
  if (!response.ok) {
    if (json && "ok" in json) return json;
    return { ok: false, error: "Failed to generate quiz." };
  }
  return json;
}
