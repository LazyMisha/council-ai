import { isFinishRequestBody } from "@/features/chat-room/api/contracts";
import { detectFinish } from "@/features/chat-room/server/finish-detector";

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
