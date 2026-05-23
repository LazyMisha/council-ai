import type { AIInstance, Message } from "../domain/types";
import { chatRoomModel, createOpenAIClient } from "./openai";

export type SpeakerSelection = {
  status: "selected";
  aiInstanceId: string;
  reason: string;
};

export async function selectSpeaker({
  aiInstances,
  recentMessages,
}: {
  aiInstances: AIInstance[];
  recentMessages: Message[];
}): Promise<SpeakerSelection> {
  if (aiInstances.length === 0) {
    return {
      status: "selected",
      aiInstanceId: "",
      reason: "No AI instances available.",
    };
  }

  const client = createOpenAIClient();

  if (!client) {
    return fallbackSelectSpeaker(aiInstances, recentMessages);
  }

  try {
    const response = await client.responses.create({
      model: chatRoomModel,
      instructions: buildSelectorInstructions(),
      input: buildSelectorInput({ aiInstances, recentMessages }),
      max_output_tokens: 80,
    });

    const content = response.output_text.trim();
    const parsed = parseSelectorOutput(content);
    const lastSpeakerId = findLastSpeakerId(aiInstances, recentMessages);
    const isValidChoice =
      parsed?.status === "selected" &&
      aiInstances.some((instance) => instance.id === parsed.aiInstanceId);

    const isSameAsLastSpeaker =
      parsed?.status === "selected" &&
      parsed.aiInstanceId === lastSpeakerId &&
      aiInstances.length > 1;

    if (isValidChoice && !isSameAsLastSpeaker) {
      return parsed;
    }

    return fallbackSelectSpeaker(aiInstances, recentMessages);
  } catch {
    return fallbackSelectSpeaker(aiInstances, recentMessages);
  }
}

function buildSelectorInstructions(): string {
  return [
    "You are an internal discussion moderator for a CouncilAI chat room.",
    "Your job is to select exactly ONE AI instance to speak next in a continuing discussion.",
    "You are invisible. You do not appear in the chat. You only choose the next speaker.",
    "Do not generate visible chat content, draft a reply, or summarize the discussion.",
    "",
    "Selection criteria:",
    "- Which AI instance can add the most value now",
    "- Who has not spoken recently",
    "- Who can address unresolved disagreement",
    "- Who can challenge weak assumptions",
    "- Who can move the discussion toward a useful conclusion",
    "- Who should naturally reply to the latest participant, not only the original user topic",
    "- Who can create realistic back-and-forth between participants",
    "- Who can add disagreement, refinement, or continuation over isolated advice",
    "- Avoid selecting an AI instance that would likely repeat previous points",
    "- Avoid selecting a role only because it can answer the user's original question",
    "- Avoid selecting a role that would produce a generic standalone answer",
    "- Prefer a role that can move the room discussion forward",
    "",
    "Important rules:",
    "- Do not select the same AI instance that spoke last if another AI instance can contribute.",
    "- Prefer a participant who can respond to, challenge, clarify, or extend the previous message.",
    "- Choose the next speaker for a natural multi-participant discussion.",
    "- Avoid repetition.",
    "",
    "Respond with ONLY a JSON object in this exact format:",
    '{"status": "selected", "aiInstanceId": "<id>", "reason": "<brief reason>"}',
    "Keep reason under 12 words.",
    "No markdown, no extra text.",
  ].join("\n");
}

function buildSelectorInput({
  aiInstances,
  recentMessages,
}: {
  aiInstances: AIInstance[];
  recentMessages: Message[];
}): string {
  const instanceList = aiInstances
    .map((instance) => {
      const lines = [`ID: ${instance.id}`, `Name: ${instance.name}`];
      if (instance.instructions) {
        lines.push(`Instructions: ${instance.instructions}`);
      }
      if (instance.description) {
        lines.push(`Description: ${instance.description}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

  const recentContext = recentMessages
    .map((message) => {
      const author =
        message.authorType === "ai" && message.role
          ? message.role
          : message.authorType;

      return `${author}: ${message.content}`;
    })
    .join("\n");

  return [
    "Available AI instances:",
    instanceList,
    "",
    "Recent chat room conversation, oldest to newest:",
    recentContext || "No previous messages.",
  ].join("\n");
}

function parseSelectorOutput(content: string): SpeakerSelection | null {
  try {
    const json = JSON.parse(content) as unknown;

    if (!isRecord(json) || typeof json.reason !== "string") {
      return null;
    }

    if (
      (json.status === undefined || json.status === "selected") &&
      typeof json.aiInstanceId === "string" &&
      typeof json.reason === "string"
    ) {
      return {
        status: "selected",
        aiInstanceId: json.aiInstanceId,
        reason: json.reason,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function fallbackSelectSpeaker(
  aiInstances: AIInstance[],
  recentMessages: Message[],
): SpeakerSelection {
  if (aiInstances.length === 0) {
    return {
      status: "selected",
      aiInstanceId: "",
      reason: "No AI instances available.",
    };
  }

  if (aiInstances.length === 1) {
    return {
      status: "selected",
      aiInstanceId: aiInstances[0].id,
      reason: "Only one AI instance available.",
    };
  }

  const stats = new Map<string, { lastIndex: number; count: number }>();
  for (const instance of aiInstances) {
    stats.set(instance.id, { lastIndex: -1, count: 0 });
  }

  for (let i = 0; i < recentMessages.length; i++) {
    const message = recentMessages[i];
    if (message.authorType === "ai" && message.role) {
      const instance = aiInstances.find((inst) => inst.name === message.role);
      if (instance) {
        const s = stats.get(instance.id)!;
        s.lastIndex = i;
        s.count += 1;
      }
    }
  }

  const lastSpeakerId = findLastSpeakerId(aiInstances, recentMessages);

  const sorted = [...aiInstances].sort((a, b) => {
    const sa = stats.get(a.id)!;
    const sb = stats.get(b.id)!;
    if (sa.lastIndex !== sb.lastIndex) {
      return sa.lastIndex - sb.lastIndex;
    }
    return sa.count - sb.count;
  });

  const candidates = lastSpeakerId
    ? sorted.filter((instance) => instance.id !== lastSpeakerId)
    : sorted;

  const selected = candidates[0] ?? sorted[0] ?? aiInstances[0];

  return {
    status: "selected",
    aiInstanceId: selected.id,
    reason: `Deterministic fallback: ${selected.name} has spoken least recently.`,
  };
}

function findLastSpeakerId(
  aiInstances: AIInstance[],
  recentMessages: Message[],
): string | undefined {
  for (let i = recentMessages.length - 1; i >= 0; i--) {
    const message = recentMessages[i];
    if (message.authorType === "ai" && message.role) {
      const instance = aiInstances.find((inst) => inst.name === message.role);
      if (instance) {
        return instance.id;
      }
    }
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
