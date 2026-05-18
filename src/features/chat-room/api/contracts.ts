import type { AIInstance, Message } from "../domain/types";
import type { DiscussionMode } from "../server/role-prompts";

export type RespondRequestBody = {
  latestUserMessage?: string;
  aiInstances: AIInstance[];
  recentMessages: Message[];
  mode?: DiscussionMode;
};

export type FinishRequestBody = {
  aiInstances: AIInstance[];
  recentMessages: Message[];
};

export type SummarizeRequestBody = {
  recentMessages: Message[];
};

export function isRespondRequestBody(
  body: unknown,
): body is RespondRequestBody {
  if (!isRecord(body)) {
    return false;
  }

  return (
    isDiscussionMode(body.mode) &&
    isValidLatestUserMessage(body) &&
    Array.isArray(body.aiInstances) &&
    body.aiInstances.every(isAIInstance) &&
    Array.isArray(body.recentMessages) &&
    body.recentMessages.every(isMessage)
  );
}

export function isFinishRequestBody(body: unknown): body is FinishRequestBody {
  return (
    isRecord(body) &&
    Array.isArray(body.aiInstances) &&
    body.aiInstances.every(isAIInstance) &&
    Array.isArray(body.recentMessages) &&
    body.recentMessages.every(isMessage)
  );
}

export function isSummarizeRequestBody(
  body: unknown,
): body is SummarizeRequestBody {
  return (
    isRecord(body) &&
    Array.isArray(body.recentMessages) &&
    body.recentMessages.every(isMessage)
  );
}

function isValidLatestUserMessage(body: Record<string, unknown>) {
  const mode = body.mode ?? "reply";

  if (mode === "continue") {
    return (
      body.latestUserMessage === undefined ||
      typeof body.latestUserMessage === "string"
    );
  }

  return (
    typeof body.latestUserMessage === "string" &&
    body.latestUserMessage.trim().length > 0
  );
}

function isDiscussionMode(value: unknown): value is DiscussionMode | undefined {
  return value === undefined || value === "reply" || value === "continue";
}

function isAIInstance(value: unknown): value is AIInstance {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.instructions === "string" &&
    value.instructions.trim().length > 0 &&
    (value.description === undefined || typeof value.description === "string")
  );
}

function isMessage(value: unknown): value is Message {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isAuthorType(value.authorType) &&
    typeof value.content === "string" &&
    (value.role === undefined ||
      (typeof value.role === "string" && value.role.trim().length > 0))
  );
}

function isAuthorType(value: unknown) {
  return (
    value === "user" ||
    value === "ai" ||
    value === "system" ||
    value === "summary"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
