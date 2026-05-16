import { generateAIResponses } from "@/lib/chat-room/ai-orchestrator";
import type { AIInstance, Message } from "@/lib/chat-room/types";

type RespondRequestBody = {
  latestUserMessage: string;
  aiInstances: AIInstance[];
  recentMessages: Message[];
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isRespondRequestBody(body)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { messages } = await generateAIResponses(body);

  return Response.json({ messages });
}

function isRespondRequestBody(body: unknown): body is RespondRequestBody {
  if (!isRecord(body)) {
    return false;
  }

  return (
    typeof body.latestUserMessage === "string" &&
    body.latestUserMessage.trim().length > 0 &&
    Array.isArray(body.aiInstances) &&
    body.aiInstances.every(isAIInstance) &&
    Array.isArray(body.recentMessages) &&
    body.recentMessages.every(isMessage)
  );
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
  return value === "user" || value === "ai" || value === "system";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
