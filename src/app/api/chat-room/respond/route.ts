import { isRespondRequestBody } from "@/features/chat-room/api/contracts";
import { generateAIResponses } from "@/features/chat-room/server/ai-orchestrator";

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
