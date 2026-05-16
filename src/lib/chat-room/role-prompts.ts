import type { Message } from "./types";

export function buildRoleInstructions({
  name,
  instructions,
}: {
  name: string;
  instructions: string;
}) {
  return [
    `You are the ${name} AI instance in a CouncilAI chat room.`,
    instructions,
    "Reply in 1-2 short sentences.",
    "Stay concrete, chat-like, and specific to the user's latest message.",
    "Do not mention that you are an AI model.",
  ].join(" ");
}

export function buildRoleInput({
  latestUserMessage,
  recentMessages,
}: {
  latestUserMessage: string;
  recentMessages: Message[];
}) {
  const recentContext = recentMessages
    .slice(-6)
    .map((message) => {
      const author =
        message.authorType === "ai" && message.role
          ? message.role
          : message.authorType;

      return `${author}: ${message.content}`;
    })
    .join("\n");

  return [
    "Recent chat room context:",
    recentContext || "No previous messages.",
    "",
    "Latest user message:",
    latestUserMessage,
  ].join("\n");
}
