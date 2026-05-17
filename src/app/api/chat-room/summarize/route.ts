import { generateSummary } from "@/lib/chat-room/summary-orchestrator";
import type { Message } from "@/lib/chat-room/types";

type SummarizeRequestBody = {
  recentMessages: Message[];
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isSummarizeRequestBody(body)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { message } = await generateSummary(body);

  return Response.json({ message });
}

function isSummarizeRequestBody(body: unknown): body is SummarizeRequestBody {
  return (
    isRecord(body) &&
    Array.isArray(body.recentMessages) &&
    body.recentMessages.every(isMessage)
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
