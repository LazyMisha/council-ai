import type { StreamEvent } from "../server/ai-orchestrator";
import type { FinishDecision } from "../server/finish-detector";
import type { DiscussionMode } from "../server/role-prompts";
import type { SpeakerSelection } from "../server/speaker-selector";
import type { AIInstance, Message } from "../domain/types";

type RespondInput = {
  latestUserMessage?: string;
  aiInstances: AIInstance[];
  recentMessages: Message[];
  mode: DiscussionMode;
  targetAIInstanceId?: string;
};

export async function* streamAIResponses(
  input: RespondInput,
): AsyncGenerator<StreamEvent> {
  const response = await fetch("/api/chat-room/respond", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok || !response.body) {
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line) as StreamEvent;
        yield event;
      } catch {
        // Skip malformed lines.
      }
    }
  }

  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer) as StreamEvent;
      yield event;
    } catch {
      // Skip malformed final line.
    }
  }
}

export async function requestSpeakerSelection({
  aiInstances,
  recentMessages,
}: {
  aiInstances: AIInstance[];
  recentMessages: Message[];
}) {
  const response = await fetch("/api/chat-room/select-speaker", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      aiInstances,
      recentMessages,
    }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as SpeakerSelection;
}

export async function requestFinishDecision({
  aiInstances,
  recentMessages,
}: {
  aiInstances: AIInstance[];
  recentMessages: Message[];
}) {
  const response = await fetch("/api/chat-room/finish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      aiInstances,
      recentMessages,
    }),
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as FinishDecision;
}

export async function requestSummary(recentMessages: Message[]) {
  const response = await fetch("/api/chat-room/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recentMessages,
    }),
  });

  if (!response.ok) {
    return undefined;
  }

  const data = (await response.json()) as { message?: Message };
  return data.message;
}
