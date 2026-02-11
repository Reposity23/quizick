import OpenAI from "openai";

let cachedKey: string | null = null;

function resolveApiKey(): string {
  if (cachedKey) return cachedKey;

  const envKey = process.env.XAI_API_KEY?.trim();
  if (envKey) {
    cachedKey = envKey;
    return envKey;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const config = require("./config") as { XAI_API_KEY?: string };
    const fileKey = config.XAI_API_KEY?.trim();
    if (fileKey) {
      cachedKey = fileKey;
      return fileKey;
    }
  } catch {
    // intentionally ignore missing local config.ts
  }

  throw new Error("XAI_API_KEY is missing. Set process.env.XAI_API_KEY or create server/src/config.ts.");
}

export function getXaiClient(): OpenAI {
  const apiKey = resolveApiKey();
  return new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1"
  });
}
