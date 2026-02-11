import type { QuizPayload, QuizQuestion } from "./api";

export type UserAnswers = {
  mcq: Record<string, number | undefined>;
  text: Record<string, string>;
  matching: Record<string, Record<string, string>>;
};

export type ScoreResult = {
  earnedPoints: number;
  totalPoints: number;
  percent: number;
  perQuestion: Array<{
    id: string;
    type: QuizQuestion["type"];
    earned: number;
    total: number;
    correct: boolean;
    pairBreakdown?: Array<{ left: string; selected: string; expected: string; correct: boolean }>;
  }>;
};

const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

export function scoreQuiz(quiz: QuizPayload, answers: UserAnswers): ScoreResult {
  let earnedPoints = 0;
  let totalPoints = 0;
  const perQuestion: ScoreResult["perQuestion"] = [];

  for (const question of quiz.questions) {
    if (question.type === "mcq") {
      totalPoints += 1;
      const selected = answers.mcq[question.id];
      const correct = selected === question.answer_index;
      if (correct) earnedPoints += 1;
      perQuestion.push({ id: question.id, type: question.type, earned: correct ? 1 : 0, total: 1, correct });
    } else if (question.type === "fill_blank" || question.type === "identification") {
      totalPoints += 1;
      const input = normalize(answers.text[question.id] ?? "");
      const accepted = question.answers.map(normalize);
      const correct = accepted.includes(input);
      if (correct) earnedPoints += 1;
      perQuestion.push({ id: question.id, type: question.type, earned: correct ? 1 : 0, total: 1, correct });
    } else {
      const selectedPairs = answers.matching[question.id] ?? {};
      const total = question.pairs.length;
      totalPoints += total;
      let earned = 0;
      const breakdown = question.pairs.map((pair) => {
        const selected = selectedPairs[pair.left] ?? "";
        const correct = selected === pair.right;
        if (correct) earned += 1;
        return { left: pair.left, selected, expected: pair.right, correct };
      });
      earnedPoints += earned;
      perQuestion.push({ id: question.id, type: question.type, earned, total, correct: earned === total, pairBreakdown: breakdown });
    }
  }

  return {
    earnedPoints,
    totalPoints,
    percent: totalPoints ? Math.round((earnedPoints / totalPoints) * 10000) / 100 : 0,
    perQuestion
  };
}
