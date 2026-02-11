import katex from "katex";
import "katex/dist/katex.min.css";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism-tomorrow.css";

function renderLatexSegments(text: string): string {
  let output = text;
  output = output.replace(/\\\[(.+?)\\\]/gs, (_m, expr) => katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false }));
  output = output.replace(/\\\((.+?)\\\)/gs, (_m, expr) => katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false }));
  return output;
}

export function renderRichText(container: HTMLElement, text: string): void {
  const codeRegex = /```([\s\S]*?)```/g;
  const parts: Array<{ type: "text" | "code"; value: string }> = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > cursor) parts.push({ type: "text", value: text.slice(cursor, match.index) });
    parts.push({ type: "code", value: match[1].trim() });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) parts.push({ type: "text", value: text.slice(cursor) });

  container.innerHTML = "";
  for (const part of parts) {
    if (part.type === "text") {
      const block = document.createElement("div");
      block.innerHTML = renderLatexSegments(part.value);
      container.appendChild(block);
    } else {
      const pre = document.createElement("pre");
      pre.className = "code-window";
      const code = document.createElement("code");
      code.className = "language-javascript";
      code.textContent = part.value;
      pre.appendChild(code);
      container.appendChild(pre);
      Prism.highlightElement(code);
    }
  }
}
