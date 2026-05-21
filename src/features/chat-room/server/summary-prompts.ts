import type { Message } from "../domain/types";

export function buildSummaryInstructions() {
  return [
    "You are a neutral internal moderator for a CouncilAI chat room.",
    "Your job is to turn the room discussion into a concise meeting note.",
    "Read the full chat-room conversation.",
    "Do not introduce new arguments or unsupported facts.",
    "Only use what participants already discussed.",
    "Keep it shorter than a generic AI report.",
    "If the discussion is weak, say so plainly.",
    "Keep the whole summary under 120 words if possible.",
    "Use short, practical wording.",
    "Do not repeat every message.",
    "Do not add generic filler.",
    "",
    "Output exactly these sections in this order, each on its own line with the label:",
    "",
    "Decision: 1 short line",
    "Why: 1-2 short lines",
    "Open risks: 1-2 short lines",
    "Next move: 1 short line",
  ].join("\n");
}

export function buildSummaryInput({ messages }: { messages: Message[] }) {
  const conversation = messages
    .map((message) => {
      const author =
        message.authorType === "ai" && message.role
          ? message.role
          : message.authorType === "summary"
            ? "Summary"
            : message.authorType;

      return `${author}: ${message.content}`;
    })
    .join("\n");

  return [
    "Chat room conversation, oldest to newest:",
    conversation || "No conversation yet.",
    "",
    "Create a concise moderator summary with exactly these sections:",
    "Decision",
    "Why",
    "Open risks",
    "Next move",
  ].join("\n");
}
