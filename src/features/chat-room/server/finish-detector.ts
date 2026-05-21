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
      max_output_tokens: 80,
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
    "- at least two different AI roles contributed",
    "- at least one participant reacted to another participant",
    "- at least one disagreement, refinement, or tradeoff exists",
    "- the discussion has a concrete direction, not just generic advice",
    "",
    "continue_discussion:",
    "- discussion is still shallow",
    "- roles gave isolated answers to the user instead of reacting to each other",
    "- important roles have not contributed enough",
    "- disagreement or tradeoff is missing",
    "- next step is still vague",
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
  const uniqueRoles = new Set(
    aiMessages
      .map((message) => message.role)
      .filter((role): role is string => Boolean(role)),
  );

  if (aiMessages.length < 5) {
    return {
      status: "continue_discussion",
      reason: "Discussion is still shallow with limited AI contributions.",
    };
  }

  if (uniqueRoles.size < 3) {
    return {
      status: "continue_discussion",
      reason: "Discussion needs more distinct AI roles before summary.",
    };
  }

  return {
    status: "ready_to_summarize",
    reason: "Enough AI messages and distinct roles exist for summary.",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
