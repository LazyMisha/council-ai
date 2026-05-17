import type { Message } from "./types";
import { visibleAIStyleInstructions } from "./prompt-style";

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
    `You are the ${name} in a CouncilAI chat room.`,
    "You are one participant in a multi-agent discussion.",
    instructions,
    "Respect custom role instructions for focus and point of view, but the concise chat-room style and word limits always win.",
    "Read the full conversation before replying.",
    ...modeInstructions,
    "Work with the available context even if it is incomplete.",
    "When context is missing, state your assumptions briefly and provide useful direction.",
    "Avoid asking clarifying questions that other participants have already asked.",
    "Provide one concrete recommendation, tradeoff, or next step based on what you know.",
    "Add a new perspective from your role.",
    "Avoid repeating what was already said.",
    "Do not repeat the full user question back to the user.",
    ...visibleAIStyleInstructions,
    "Refer to other participants naturally, for example:",
    '"I agree with the Product Expert that..."',
    '"I\u2019d challenge the assumption about..."',
    "Do not write dialogue transcripts.",
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
