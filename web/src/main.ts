import "./styles.css";
import { generateQuizRequest, type QuizPayload, type QuizType } from "./api";
import { renderQuizForm } from "./renderQuiz";
import { createTimer } from "./timer";
import { renderDebugPanel } from "./debug";
import { scoreQuiz, type UserAnswers } from "./scoring";

const app = document.getElementById("app");
if (!app) throw new Error("app root not found");

const state: {
  files: File[];
  quiz?: QuizPayload;
  loading: boolean;
  error?: string;
  answers: UserAnswers;
  timer?: ReturnType<typeof createTimer>;
  rawOutput?: string;
  validationErrors?: string;
  parseFallback?: string;
} = {
  files: [],
  loading: false,
  answers: { mcq: {}, text: {}, matching: {} }
};

function resetAnswers() {
  state.answers = { mcq: {}, text: {}, matching: {} };
}

function selectFiles(inputFiles: FileList | null) {
  if (!inputFiles) return;
  const files = Array.from(inputFiles);
  if (files.length > 10) {
    state.error = "You can upload at most 10 files.";
    render();
    return;
  }
  const overLimit = files.find((f) => f.size > 20 * 1024 * 1024);
  if (overLimit) {
    state.error = `File exceeds 20MB limit: ${overLimit.name}`;
    render();
    return;
  }
  state.error = undefined;
  state.files = files;
  render();
}

function render() {
  app.innerHTML = `
    <main class="container">
      <h1>QuizForge Prototype</h1>
      <p class="subtitle">Upload class files and generate exam-ready quizzes with Grok.</p>
      <section class="panel" id="setup-panel"></section>
      <section class="panel" id="quiz-panel"></section>
      <section class="panel" id="result-panel"></section>
      <section class="panel" id="debug-panel"></section>
    </main>
  `;

  const setupPanel = document.getElementById("setup-panel") as HTMLElement;
  const quizPanel = document.getElementById("quiz-panel") as HTMLElement;
  const resultPanel = document.getElementById("result-panel") as HTMLElement;
  const debugPanel = document.getElementById("debug-panel") as HTMLElement;

  setupPanel.innerHTML = `
    <h2>1) Upload Files</h2>
    <div class="dropzone" id="dropzone">Drag & drop files here or click Browse</div>
    <input id="file-input" type="file" multiple hidden />
    <button id="browse-btn" class="btn">Browse Files</button>
    <p>Total selected: <strong>${state.files.length}</strong></p>
    <ul class="file-list">${state.files.map((f) => `<li>${f.name} (${(f.size / (1024 * 1024)).toFixed(2)} MB)</li>`).join("")}</ul>
    ${state.error ? `<p class="error">${state.error}</p>` : ""}
  `;

  const dropzone = document.getElementById("dropzone") as HTMLElement;
  const fileInput = document.getElementById("file-input") as HTMLInputElement;
  const browseBtn = document.getElementById("browse-btn") as HTMLButtonElement;

  browseBtn.onclick = () => fileInput.click();
  fileInput.onchange = () => selectFiles(fileInput.files);
  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.classList.add("dragging");
  };
  dropzone.ondragleave = () => dropzone.classList.remove("dragging");
  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragging");
    selectFiles(e.dataTransfer?.files ?? null);
  };

  if (!state.quiz) {
    quizPanel.innerHTML = "";
    resultPanel.innerHTML = "";
    if (state.files.length > 0) {
      const counts = [5, 10, 20, 30, 50, 100];
      quizPanel.innerHTML = `
        <h2>2) Quiz Options</h2>
        <label>Quiz Type
          <select id="quiz-type">
            <option value="mcq">Multiple Choice</option>
            <option value="fill_blank">Fill in the Blank</option>
            <option value="identification">Identification</option>
            <option value="matching">Matching</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>
        <div>
          <p>Question Count</p>
          <div class="count-buttons">${counts.map((c) => `<button class="count-btn" data-count="${c}">${c}</button>`).join("")}</div>
          <input id="custom-count" type="number" min="1" max="100" value="10" />
        </div>
        <label>Difficulty (optional)
          <select id="difficulty">
            <option value="">Not specified</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <button id="generate-btn" class="btn primary" ${state.loading ? "disabled" : ""}>${state.loading ? "Generating..." : "Generate Quiz"}</button>
      `;

      let selectedCount = 10;
      quizPanel.querySelectorAll(".count-btn").forEach((button) => {
        button.addEventListener("click", () => {
          selectedCount = Number((button as HTMLButtonElement).dataset.count || "10");
          (document.getElementById("custom-count") as HTMLInputElement).value = `${selectedCount}`;
        });
      });

      const generateBtn = document.getElementById("generate-btn") as HTMLButtonElement;
      generateBtn.onclick = async () => {
        state.loading = true;
        state.error = undefined;
        render();

        const quizType = (document.getElementById("quiz-type") as HTMLSelectElement).value as QuizType;
        const customCount = Number((document.getElementById("custom-count") as HTMLInputElement).value);
        const count = Number.isFinite(customCount) ? Math.max(1, Math.min(100, customCount)) : selectedCount;
        const difficulty = (document.getElementById("difficulty") as HTMLSelectElement).value;

        const formData = new FormData();
        state.files.forEach((file) => formData.append("files", file));
        formData.append("quizType", quizType);
        formData.append("questionCount", `${count}`);
        if (difficulty) formData.append("difficulty", difficulty);

        const response = await generateQuizRequest(formData);
        state.loading = false;
        state.rawOutput = response.raw;
        state.validationErrors = "details" in response ? response.details : undefined;
        state.parseFallback = !response.ok && !response.details ? response.raw : undefined;

        if (!response.ok) {
          state.error = response.error;
          render();
          return;
        }

        state.quiz = response.quiz;
        state.error = undefined;
        resetAnswers();
        state.timer = createTimer();
        render();
      };
    }
  } else {
    setupPanel.innerHTML += `<button id="back-btn" class="btn">Back to Setup</button>`;
    (document.getElementById("back-btn") as HTMLButtonElement).onclick = () => {
      state.quiz = undefined;
      resetAnswers();
      render();
    };

    renderQuizForm({
      root: quizPanel,
      quiz: state.quiz,
      answers: state.answers,
      onChange: () => void 0
    });

    const controls = document.createElement("div");
    controls.className = "actions";
    controls.innerHTML = `
      <button id="submit-quiz" class="btn primary">Submit Quiz</button>
      <button id="reset-answers" class="btn">Reset Answers</button>
    `;
    quizPanel.appendChild(controls);

    (document.getElementById("reset-answers") as HTMLButtonElement).onclick = () => {
      resetAnswers();
      render();
    };

    (document.getElementById("submit-quiz") as HTMLButtonElement).onclick = () => {
      const score = scoreQuiz(state.quiz as QuizPayload, state.answers);
      const timeTaken = state.timer?.elapsedLabel() ?? "0m 0s";
      const toggleAnswersId = "toggle-answers";
      const toggleExplanationId = "toggle-explanations";

      resultPanel.innerHTML = `
        <h2>Results</h2>
        <p><strong>Score:</strong> ${score.earnedPoints} / ${score.totalPoints}</p>
        <p><strong>Percentage:</strong> ${score.percent}%</p>
        <p><strong>Time taken:</strong> ${timeTaken}</p>
        <label><input type="checkbox" id="${toggleAnswersId}" /> Show Answers</label>
        <label><input type="checkbox" id="${toggleExplanationId}" /> Show Explanations</label>
        <div id="question-results"></div>
      `;

      const resultBody = document.getElementById("question-results") as HTMLElement;
      const renderDetails = () => {
        const showAnswers = (document.getElementById(toggleAnswersId) as HTMLInputElement).checked;
        const showExplanations = (document.getElementById(toggleExplanationId) as HTMLInputElement).checked;

        resultBody.innerHTML = (state.quiz as QuizPayload).questions.map((question, idx) => {
          const per = score.perQuestion[idx];
          const answerDetail = (() => {
            if (!showAnswers) return "";
            if (question.type === "mcq") return `<p><strong>Answer:</strong> ${question.choices[question.answer_index]}</p>`;
            if (question.type === "matching") return `<ul>${question.pairs.map((p) => `<li>${p.left} → ${p.right}</li>`).join("")}</ul>`;
            return `<p><strong>Answer(s):</strong> ${question.answers.join(", ")}</p>`;
          })();

          const pairBreakdown = question.type === "matching" && per.pairBreakdown
            ? `<ul>${per.pairBreakdown.map((p) => `<li>${p.left}: selected "${p.selected || "(none)"}" | expected "${p.expected}" ${p.correct ? "✅" : "❌"}</li>`).join("")}</ul>`
            : "";

          return `
            <article class="result-item ${per.correct ? "correct" : "incorrect"}">
              <h4>Q${idx + 1} - ${per.correct ? "Correct" : "Incorrect"} (${per.earned}/${per.total})</h4>
              ${answerDetail}
              ${pairBreakdown}
              ${showExplanations ? `<p><strong>Explanation:</strong> ${question.explanation}</p>` : ""}
            </article>
          `;
        }).join("");
      };

      (document.getElementById(toggleAnswersId) as HTMLInputElement).onchange = renderDetails;
      (document.getElementById(toggleExplanationId) as HTMLInputElement).onchange = renderDetails;
      renderDetails();
    };
  }

  renderDebugPanel({
    container: debugPanel,
    rawOutput: state.rawOutput,
    validationErrors: state.validationErrors,
    parseFallback: state.parseFallback
  });
}

render();
