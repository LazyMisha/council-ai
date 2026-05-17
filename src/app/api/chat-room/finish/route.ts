import { detectFinish } from "@/lib/chat-room/finish-detector";
import type { AIInstance, Message } from "@/lib/chat-room/types";

type FinishRequestBody = {
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

  if (!isFinishRequestBody(body)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const decision = await detectFinish(body);

  return Response.json(decision);
}

function isFinishRequestBody(body: unknown): body is FinishRequestBody {
  return (
    isRecord(body) &&
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
