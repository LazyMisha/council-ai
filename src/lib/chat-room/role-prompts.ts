import type { Message } from "./types";

export type DiscussionMode = "reply" | "continue";

export function buildRoleInstructions({
  name,
  instructions,
  mode = "reply",
}: {
  name: string;
  instructions: string;
  mode?: DiscussionMode;
}) {
  const modeInstructions =
    mode === "continue"
      ? [
          "Continue the existing chat-room discussion.",
          "Focus on unresolved issues, disagreements, assumptions, or next steps.",
        ]
      : [
          "Respond to the user's topic and the current chat-room context.",
          "The previous AI messages in this same round are part of the conversation.",
        ];

  return [
    `You are the ${name} AI instance in a CouncilAI chat room.`,
    "You are a participant in a multi-agent chat room.",
    instructions,
    "Read the full conversation so far before replying.",
    ...modeInstructions,
    "React to previous participants when useful.",
    "Add a new perspective from your role, mentioning agreement or disagreement when relevant.",
    "Avoid repeating what was already said.",
    "Keep it concise and conversational.",
    "Reply in 1-2 short sentences.",
    "Do not mention that you are an AI model.",
  ].join(" ");
}

export function buildRoleInput({
  latestUserMessage,
  recentMessages,
  mode = "reply",
}: {
  latestUserMessage?: string;
  recentMessages: Message[];
  mode?: DiscussionMode;
}) {
  const recentContext = recentMessages
    .map((message) => {
      const author =
        message.authorType === "ai" && message.role
          ? message.role
          : message.authorType;

      return `${author}: ${message.content}`;
    })
    .join("\n");

  if (mode === "continue") {
    return [
      "Recent chat room conversation, oldest to newest:",
      recentContext || "No previous messages.",
      "",
      "Discussion task:",
      "Continue the discussion from the conversation above. Do not wait for a new user message.",
    ].join("\n");
  }

  return [
    "Recent chat room conversation, oldest to newest:",
    recentContext || "No previous messages.",
    "",
    "Latest user message:",
    latestUserMessage ?? "",
  ].join("\n");
}
