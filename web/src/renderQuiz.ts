import type { QuizPayload } from "./api";
import { renderRichText } from "./latex";
import type { UserAnswers } from "./scoring";

export function renderQuizForm(params: {
  root: HTMLElement;
  quiz: QuizPayload;
  answers: UserAnswers;
  onChange: () => void;
}): void {
  const { root, quiz, answers, onChange } = params;
  root.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = quiz.quiz_title;
  root.appendChild(title);

  const summary = document.createElement("p");
  summary.textContent = quiz.source_summary;
  root.appendChild(summary);

  quiz.questions.forEach((question, qIndex) => {
    const card = document.createElement("section");
    card.className = "question-card";

    const head = document.createElement("h3");
    head.textContent = `${qIndex + 1}. ${question.type.toUpperCase()}`;
    card.appendChild(head);

    const promptBox = document.createElement("div");
    promptBox.className = "prompt";
    if ("prompt" in question) {
      renderRichText(promptBox, question.prompt);
    }
    card.appendChild(promptBox);

    if (question.type === "mcq") {
      question.choices.forEach((choice, idx) => {
        const label = document.createElement("label");
        label.className = "inline-option";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = question.id;
        input.checked = answers.mcq[question.id] === idx;
        input.addEventListener("change", () => {
          answers.mcq[question.id] = idx;
          onChange();
        });
        const text = document.createElement("span");
        renderRichText(text, choice);
        label.append(input, text);
        card.appendChild(label);
      });
    }

    if (question.type === "fill_blank" || question.type === "identification") {
      const input = document.createElement("input");
      input.type = "text";
      input.className = "text-answer";
      input.value = answers.text[question.id] ?? "";
      input.placeholder = "Type your answer";
      input.addEventListener("input", () => {
        answers.text[question.id] = input.value;
        onChange();
      });
      card.appendChild(input);
    }

    if (question.type === "matching") {
      const rights = question.pairs.map((pair) => pair.right);
      const userMap = answers.matching[question.id] ?? {};
      answers.matching[question.id] = userMap;

      const table = document.createElement("div");
      table.className = "matching-grid";

      question.pairs.forEach((pair) => {
        const row = document.createElement("div");
        row.className = "matching-row";

        const left = document.createElement("div");
        left.className = "left-item";
        renderRichText(left, pair.left);

        const select = document.createElement("select");
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select match";
        select.appendChild(placeholder);

        rights.forEach((right) => {
          const opt = document.createElement("option");
          opt.value = right;
          opt.textContent = right;
          select.appendChild(opt);
        });
        select.value = userMap[pair.left] ?? "";
        select.addEventListener("change", () => {
          userMap[pair.left] = select.value;
          onChange();
        });

        row.append(left, select);
        table.appendChild(row);
      });

      card.appendChild(table);
    }

    root.appendChild(card);
  });
}
