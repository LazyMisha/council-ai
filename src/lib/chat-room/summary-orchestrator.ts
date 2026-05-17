import OpenAI from "openai";
import { buildSummaryInput, buildSummaryInstructions } from "./summary-prompts";
import type { Message } from "./types";

type GenerateSummaryInput = {
  recentMessages: Message[];
};

type GenerateSummaryResult = {
  message: Message;
};

const model = "gpt-4o-mini";

export async function generateSummary({
  recentMessages,
}: GenerateSummaryInput): Promise<GenerateSummaryResult> {
  const summaryId = `summary-${Date.now()}`;

  if (!process.env.OPENAI_API_KEY) {
    return {
      message: createSummaryMessage(summaryId, createMockSummary(recentMessages)),
    };
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model,
      instructions: buildSummaryInstructions(),
      input: buildSummaryInput({ messages: recentMessages }),
    });

    const content = response.output_text.trim();

    return {
      message: createSummaryMessage(
        summaryId,
        content || createMockSummary(recentMessages),
      ),
    };
  } catch {
    return {
      message: createSummaryMessage(summaryId, createMockSummary(recentMessages)),
    };
  }
}

function createSummaryMessage(id: string, content: string): Message {
  return {
    id,
    authorType: "summary",
    role: "Moderator Summary",
    content,
  };
}

function createMockSummary(messages: Message[]) {
  const userTopic =
    [...messages].reverse().find((message) => message.authorType === "user")
      ?.content ?? "the current decision";
  const aiRoles = messages
    .filter((message) => message.authorType === "ai" && message.role)
    .map((message) => message.role);
  const uniqueRoles = Array.from(new Set(aiRoles));
  const roleList = uniqueRoles.length > 0 ? uniqueRoles.join(", ") : "the AI instances";

  return [
    `Key points: The discussion focused on "${userTopic}" with input from ${roleList}.`,
    "Disagreements / tradeoffs: Balance momentum against implementation risk, validation needs, and unresolved assumptions.",
    "Open questions: Clarify success criteria, ownership, timeline, and the riskiest dependency.",
    "Recommendation: Move forward only with a narrow next step that tests the core assumption.",
    "Next steps: Define the smallest experiment, assign owners, and revisit the decision after early evidence is available.",
  ].join("\n");
}
