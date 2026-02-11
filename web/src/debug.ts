export function renderDebugPanel(params: {
  container: HTMLElement;
  rawOutput?: string;
  validationErrors?: string;
  parseFallback?: string;
}): void {
  const { container, rawOutput, validationErrors, parseFallback } = params;
  container.innerHTML = "";

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Debug Output";
  details.appendChild(summary);

  const makeBlock = (title: string, value?: string) => {
    const section = document.createElement("div");
    section.className = "debug-section";
    const h = document.createElement("h4");
    h.textContent = title;
    section.appendChild(h);
    const pre = document.createElement("pre");
    pre.textContent = value || "(none)";
    section.appendChild(pre);
    details.appendChild(section);
  };

  makeBlock("Raw Grok output", rawOutput);
  makeBlock("JSON validation errors", validationErrors);
  makeBlock("Raw string when JSON parse fails", parseFallback);

  container.appendChild(details);
}
