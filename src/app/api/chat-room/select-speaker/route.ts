import { isSelectSpeakerRequestBody } from "@/features/chat-room/api/contracts";
import { selectSpeaker } from "@/features/chat-room/server/speaker-selector";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isSelectSpeakerRequestBody(body)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const selection = await selectSpeaker(body);

  return Response.json(selection);
}
