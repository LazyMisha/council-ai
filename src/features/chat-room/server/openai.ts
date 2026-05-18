import OpenAI from "openai";

export const chatRoomModel = "gpt-4o-mini";

export function createOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
}
