import type { AIInstance, Message } from "../domain/types";
import { chatRoomModel, createOpenAIClient } from "./openai";

export type FinishDecision = {
  status: "ready_to_summarize" | "continue_discussion";
  reason: string;
};

export async function detectFinish({
  aiInstances,
  recentMessages,
}: {
  aiInstances: AIInstance[];
  recentMessages: Message[];
}): Promise<FinishDecision> {
  const client = createOpenAIClient();

  if (!client) {
    return fallbackDetectFinish(recentMessages);
  }

  try {
    const response = await client.responses.create({
      model: chatRoomModel,
      instructions: buildFinishInstructions(),
      input: buildFinishInput({ aiInstances, recentMessages }),
    });

    const content = response.output_text.trim();
    const parsed = parseFinishOutput(content);

    if (parsed) {
      return parsed;
    }

    return fallbackDetectFinish(recentMessages);
  } catch {
    return fallbackDetectFinish(recentMessages);
  }
}

function buildFinishInstructions(): string {
  return [
    "You are an internal finish detector for a CouncilAI chat room.",
    "Your job is to evaluate whether the discussion has enough useful information to summarize.",
    "You are invisible. You do not appear in the chat. You only decide whether summarization is available.",
    "Do not generate visible chat content, status copy, or summary text.",
    "",
    "Evaluate the conversation based on these criteria:",
    "",
    "ready_to_summarize:",
    "- enough key arguments exist",
    "- at least one tradeoff or disagreement was explored",
    "- conversation has practical next steps or recommendation direction",
    "",
    "continue_discussion:",
    "- discussion is still shallow",
    "- important roles have not contributed enough",
    "- unresolved disagreement should be explored more",
    "",
    "Respond with ONLY a JSON object in this exact format:",
    '{"status": "ready_to_summarize", "reason": "brief reason"}',
    "or",
    '{"status": "continue_discussion", "reason": "brief reason"}',
    "Keep reason under 12 words.",
    "No markdown, no extra text.",
  ].join("\\n");
}

function buildFinishInput({
  aiInstances,
  recentMessages,
}: {
  aiInstances: AIInstance[];
  recentMessages: Message[];
}): string {
  const instanceList = aiInstances
    .map((instance) => {
      const lines = [`ID: ${instance.id}`, `Name: ${instance.name}`];
      if (instance.instructions) {
        lines.push(`Instructions: ${instance.instructions}`);
      }
      if (instance.description) {
        lines.push(`Description: ${instance.description}`);
      }
      return lines.join("\\n");
    })
    .join("\\n\\n");

  const recentContext = recentMessages
    .map((message) => {
      const author =
        message.authorType === "ai" && message.role
          ? message.role
          : message.authorType;

      return `${author}: ${message.content}`;
    })
    .join("\\n");

  return [
    "Available AI instances:",
    instanceList,
    "",
    "Recent chat room conversation, oldest to newest:",
    recentContext || "No previous messages.",
  ].join("\\n");
}

function parseFinishOutput(content: string): FinishDecision | null {
  try {
    const json = JSON.parse(content) as unknown;
    if (
      isRecord(json) &&
      typeof json.status === "string" &&
      typeof json.reason === "string" &&
      (json.status === "ready_to_summarize" || json.status === "continue_discussion")
    ) {
      return {
        status: json.status,
        reason: json.reason,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function fallbackDetectFinish(
  recentMessages: Message[],
): FinishDecision {
  const aiMessages = recentMessages.filter(
    (message) => message.authorType === "ai",
  );

  if (aiMessages.length < 3) {
    return {
      status: "continue_discussion",
      reason: "Discussion is still shallow with limited AI contributions.",
    };
  }

  return {
    status: "ready_to_summarize",
    reason: "Multiple AI contributions exist; summarization is reasonable.",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
