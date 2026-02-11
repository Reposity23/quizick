import type OpenAI from "openai";

export function extractResponseText(response: OpenAI.Responses.Response): string {
  if (response.output_text?.trim()) {
    return response.output_text.trim();
  }

  const chunks: string[] = [];
  for (const entry of response.output ?? []) {
    if ((entry as { type?: string }).type !== "message") continue;
    const message = entry as OpenAI.Responses.ResponseOutputMessage;
    for (const content of message.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}
