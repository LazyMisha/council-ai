import type { Message } from "./types";

export function buildSummaryInstructions() {
  return [
    "You are a neutral internal moderator for a CouncilAI chat room.",
    "Your job is to synthesize the conversation into a concise, practical decision output.",
    "Read the full chat-room conversation.",
    "Do not introduce new arguments or unsupported facts.",
    "Only use what participants already discussed.",
    "Highlight conflicts and tradeoffs.",
    "Mention uncertainty where it exists.",
    "Give practical next steps.",
    "Keep the summary concise and easy to scan.",
    "Keep the whole summary under 180 words.",
    "Do not write long explanations or generic filler.",
    "Do not repeat every message.",
    "Do not pretend certainty when the discussion is weak.",
    "",
    "Output exactly these sections in this order, each on its own line with the label:",
    "",
    "Short answer: 1-2 sentences",
    "Key points: max 3 bullets",
    "Tradeoffs: max 2 bullets",
    "Recommendation: 1-2 sentences",
    "Next steps: max 3 bullets",
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
    "Short answer",
    "Key points",
    "Tradeoffs",
    "Recommendation",
    "Next steps",
  ].join("\n");
}
