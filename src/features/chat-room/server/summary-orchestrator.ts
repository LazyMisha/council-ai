import { chatRoomModel, createOpenAIClient } from "./openai";
import { buildSummaryInput, buildSummaryInstructions } from "./summary-prompts";
import type { Message } from "../domain/types";

type GenerateSummaryInput = {
  recentMessages: Message[];
};

type GenerateSummaryResult = {
  message: Message;
};

export async function generateSummary({
  recentMessages,
}: GenerateSummaryInput): Promise<GenerateSummaryResult> {
  const summaryId = `summary-${Date.now()}`;
  const client = createOpenAIClient();

  if (!client) {
    return {
      message: createSummaryMessage(summaryId, createMockSummary(recentMessages)),
    };
  }

  try {
    const response = await client.responses.create({
      model: chatRoomModel,
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
    role: "Summary",
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
    `Short answer: The discussion on "${userTopic}" surfaced useful input from ${roleList}, but the best path depends on a few key constraints.`,
    "Key points:",
    "- Start with the smallest viable scope.",
    "- Validate assumptions early.",
    "- Identify the riskiest dependency before committing.",
    "Tradeoffs:",
    "- Speed of launch versus depth of validation.",
    "- Some participants favor momentum; others want more certainty before acting.",
    "Recommendation: Define the smallest experiment that tests the core assumption, then decide whether to scale based on evidence.",
    "Next steps:",
    "- Assign ownership for the experiment.",
    "- Set a short review date.",
    "- Agree on what success looks like before starting.",
  ].join("\n");
}
