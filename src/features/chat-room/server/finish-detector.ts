import type { AIInstance, Message } from "../domain/types";
import { chatRoomModel, createOpenAIClient } from "./openai";

export type FinishDecision =
  | {
      status: "ready_to_summarize" | "continue_discussion";
      reason: string;
    }
  | {
      status: "needs_user_input";
      reason: string;
      summary: string;
      questions: string[];
    };

const minimumAIMessagesForFinishDecision = 10;
const maxClarificationQuestions = 3;

export async function detectFinish({
  aiInstances,
  recentMessages,
}: {
  aiInstances: AIInstance[];
  recentMessages: Message[];
}): Promise<FinishDecision> {
  const recentAIMessages = getAIMessagesSinceLatestUserMessage(recentMessages);

  if (recentAIMessages.length < minimumAIMessagesForFinishDecision) {
    return {
      status: "continue_discussion",
      reason: "At least 10 AI messages are needed before stopping.",
    };
  }

  const client = createOpenAIClient();

  if (!client) {
    return fallbackDetectFinish(recentMessages);
  }

  try {
    const response = await client.responses.create({
      model: chatRoomModel,
      instructions: buildFinishInstructions(),
      input: buildFinishInput({ aiInstances, recentMessages }),
      max_output_tokens: 300,
    });

    const content = response.output_text.trim();
    const parsed = parseFinishOutput(content);

    if (parsed) {
      if (
        parsed.status === "needs_user_input" &&
        !recentAIMessages.some((message) => message.content.includes("?"))
      ) {
        return {
          status: "continue_discussion",
          reason: "No AI user questions need answers.",
        };
      }

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
    "Your job is to evaluate whether the discussion should continue, can be summarized, or needs user input.",
    "You are invisible. You do not appear in the chat. You only return a structured decision.",
    "Do not generate chat messages or status copy outside the JSON object.",
    "",
    "Hard gate:",
    "- If fewer than 10 AI messages exist after the latest user message, return continue_discussion.",
    "- Never ask the user questions before this 10 AI message minimum.",
    "",
    "Evaluate the conversation based on these criteria:",
    "",
    "ready_to_summarize:",
    "- enough key arguments exist",
    "- at least two different AI roles contributed",
    "- at least one participant reacted to another participant",
    "- at least one disagreement, refinement, or tradeoff exists",
    "- the discussion has a concrete direction, not just generic advice",
    "- no unresolved user-facing AI question blocks a useful summary",
    "",
    "needs_user_input:",
    "- at least 10 AI messages exist after the latest user message",
    "- AI instances asked user-facing clarification or justification questions",
    "- later AI messages did not already answer or make those questions irrelevant",
    "- unresolved questions block a useful summary",
    "- include a short neutral summary of the discussion before the questions",
    "- consolidate duplicate questions and ask no more than 3 concise questions",
    "",
    "continue_discussion:",
    "- discussion is still shallow",
    "- roles gave isolated answers to the user instead of reacting to each other",
    "- important roles have not contributed enough",
    "- disagreement or tradeoff is missing",
    "- next step is still vague",
    "",
    "Respond with ONLY one JSON object in one of these exact formats:",
    '{"status": "ready_to_summarize", "reason": "brief reason"}',
    '{"status": "continue_discussion", "reason": "brief reason"}',
    '{"status": "needs_user_input", "reason": "brief reason", "summary": "1-2 sentence recap", "questions": ["question"]}',
    "Keep reason under 12 words.",
    "Keep needs_user_input summary under 35 words.",
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
    `AI messages since latest user message: ${getAIMessagesSinceLatestUserMessage(recentMessages).length}`,
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
      (json.status === "ready_to_summarize" ||
        json.status === "continue_discussion")
    ) {
      return {
        status: json.status,
        reason: json.reason,
      };
    }

    if (
      isRecord(json) &&
      json.status === "needs_user_input" &&
      typeof json.reason === "string"
    ) {
      const summary =
        parseNonEmptyString(json.summary) ||
        "The discussion has unresolved user questions that block a useful summary.";
      const questions = parseQuestions(json.questions);
      if (questions.length === 0) {
        return null;
      }

      return {
        status: "needs_user_input",
        reason: json.reason,
        summary,
        questions,
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
  const aiMessages = getAIMessagesSinceLatestUserMessage(recentMessages);
  const uniqueRoles = new Set(
    aiMessages
      .map((message) => message.role)
      .filter((role): role is string => Boolean(role)),
  );

  if (aiMessages.length < minimumAIMessagesForFinishDecision) {
    return {
      status: "continue_discussion",
      reason: "At least 10 AI messages are needed before stopping.",
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

function getAIMessagesSinceLatestUserMessage(messages: Message[]) {
  const latestUserIndex = findLatestUserMessageIndex(messages);

  return messages
    .slice(latestUserIndex + 1)
    .filter((message) => message.authorType === "ai");
}

function findLatestUserMessageIndex(messages: Message[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].authorType === "user") {
      return i;
    }
  }
  return -1;
}

function parseQuestions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((question): question is string => typeof question === "string")
    .map((question) => question.trim())
    .filter(Boolean)
    .slice(0, maxClarificationQuestions);
}

function parseNonEmptyString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
