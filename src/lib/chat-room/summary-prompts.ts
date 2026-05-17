import type { Message } from "./types";

export function buildSummaryInstructions() {
  return [
    "You are a neutral internal moderator for a CouncilAI chat room.",
    "Your job is to synthesize the conversation into a useful decision output.",
    "Read the full chat-room conversation.",
    "Do not introduce new arguments or unsupported facts.",
    "Only use what participants already discussed.",
    "Highlight conflicts and tradeoffs.",
    "Mention uncertainty where it exists.",
    "Give practical next steps.",
    "Keep the summary concise and easy to scan.",
    "Output exactly these sections in this order, each on its own line with the label:",
    "",
    "Short answer: one-sentence synthesis",
    "Key points: the most important takeaways",
    "Main disagreements / tradeoffs: where participants differ",
    "Assumptions: what the group took for granted",
    "Recommendation: a clear, actionable direction",
    "Next steps: specific actions to take",
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
    "Main disagreements / tradeoffs",
    "Assumptions",
    "Recommendation",
    "Next steps",
  ].join("\n");
}
