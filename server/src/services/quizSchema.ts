import { z } from "zod";

const mcqQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.literal("mcq"),
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).min(4),
  answer_index: z.number().int().nonnegative(),
  explanation: z.string().min(1)
}).superRefine((question, ctx) => {
  if (question.answer_index >= question.choices.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "answer_index must reference an existing choices entry",
      path: ["answer_index"]
    });
  }
});

const fillBlankQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.literal("fill_blank"),
  prompt: z.string().includes("____"),
  answers: z.array(z.string().min(1)).min(1),
  explanation: z.string().min(1)
});

const identificationQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.literal("identification"),
  prompt: z.string().min(1),
  answers: z.array(z.string().min(1)).min(1),
  explanation: z.string().min(1)
});

const matchingQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.literal("matching"),
  pairs: z.array(z.object({
    left: z.string().min(1),
    right: z.string().min(1)
  })).min(1),
  explanation: z.string().min(1)
}).superRefine((question, ctx) => {
  const leftSet = new Set<string>();
  const rightSet = new Set<string>();
  question.pairs.forEach((pair, index) => {
    if (leftSet.has(pair.left)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Matching left values must be unique", path: ["pairs", index, "left"] });
    }
    if (rightSet.has(pair.right)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Matching right values must be unique", path: ["pairs", index, "right"] });
    }
    leftSet.add(pair.left);
    rightSet.add(pair.right);
  });
});

const questionSchema = z.discriminatedUnion("type", [
  mcqQuestionSchema,
  fillBlankQuestionSchema,
  identificationQuestionSchema,
  matchingQuestionSchema
]);

export const quizSchema = z.object({
  quiz_title: z.string().min(1),
  quiz_type: z.enum(["mcq", "fill_blank", "identification", "matching", "mixed"]),
  question_count: z.number().int().positive(),
  source_summary: z.string().min(1),
  questions: z.array(questionSchema).min(1)
}).superRefine((quiz, ctx) => {
  if (quiz.question_count !== quiz.questions.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "question_count must equal questions.length", path: ["question_count"] });
  }
});

export type QuizPayload = z.infer<typeof quizSchema>;
export type QuizType = QuizPayload["quiz_type"];

export function schemaJsonString(): string {
  return JSON.stringify({
    quiz_title: "string",
    quiz_type: "mcq | fill_blank | identification | matching | mixed",
    question_count: "number",
    source_summary: "string",
    questions: [
      {
        id: "string",
        type: "mcq",
        prompt: "string",
        choices: ["string"],
        answer_index: "number",
        explanation: "string"
      },
      {
        id: "string",
        type: "fill_blank",
        prompt: "string with ____",
        answers: ["string"],
        explanation: "string"
      },
      {
        id: "string",
        type: "identification",
        prompt: "string",
        answers: ["string"],
        explanation: "string"
      },
      {
        id: "string",
        type: "matching",
        pairs: [{ left: "string", right: "string" }],
        explanation: "string"
      }
    ]
  }, null, 2);
}
