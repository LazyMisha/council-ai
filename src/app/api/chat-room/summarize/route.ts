import { isSummarizeRequestBody } from "@/features/chat-room/api/contracts";
import { generateSummary } from "@/features/chat-room/server/summary-orchestrator";

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
