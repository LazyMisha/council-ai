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
      max_output_tokens: 220,
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
  const roleList =
    uniqueRoles.length > 0 ? uniqueRoles.join(", ") : "the AI instances";
  const recentPoints = messages
    .filter((message) => message.authorType === "ai")
    .slice(-3)
    .map((message) => compactPoint(message.content));
  const why =
    recentPoints.length > 0
      ? recentPoints.join(" ")
      : "The room has not added enough concrete input yet.";

  return [
    `Decision: Not settled yet for "${compactPoint(userTopic)}".`,
    `Why: ${roleList} contributed. ${why}`,
    "Open risks: Any unresolved risks are the ones named above.",
    "Next move: Choose the clearest point above and act on it.",
  ].join("\n");
}

function compactPoint(content: string) {
  const words = content.trim().replace(/\s+/g, " ").split(" ");
  return words.slice(0, 18).join(" ");
}
