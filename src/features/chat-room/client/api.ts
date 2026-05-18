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

export async function requestAIResponses(input: RespondInput) {
  const response = await fetch("/api/chat-room/respond", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { messages?: Message[] };
  return data.messages ?? [];
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
