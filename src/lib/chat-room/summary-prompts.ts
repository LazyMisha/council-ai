import type { Message } from "./types";

export function buildSummaryInstructions() {
  return [
    "Act as a neutral internal moderator for a CouncilAI chat room.",
    "Read the full chat-room conversation.",
    "Do not introduce new arguments.",
    "Synthesize what participants already discussed.",
    "Highlight conflicts and tradeoffs.",
    "Give practical next steps.",
    "Keep the summary concise and useful.",
  ].join(" ");
}

export function buildSummaryInput({ messages }: { messages: Message[] }) {
  const conversation = messages
    .map((message) => {
      const author =
        message.authorType === "ai" && message.role
          ? message.role
          : message.authorType === "summary"
            ? "Moderator Summary"
            : message.authorType;

      return `${author}: ${message.content}`;
    })
    .join("\n");

  return [
    "Chat room conversation, oldest to newest:",
    conversation || "No conversation yet.",
    "",
    "Create a concise moderator summary with these sections:",
    "Key points",
    "Disagreements / tradeoffs",
    "Open questions",
    "Recommendation",
    "Next steps",
  ].join("\n");
}
