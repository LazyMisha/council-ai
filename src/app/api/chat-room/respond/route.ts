import { isRespondRequestBody } from "@/features/chat-room/api/contracts";
import { streamAIResponse } from "@/features/chat-room/server/ai-orchestrator";

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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamAIResponse(body)) {
          controller.enqueue(
            encoder.encode(JSON.stringify(event) + "\n"),
          );
        }
        controller.close();
      } catch {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}
