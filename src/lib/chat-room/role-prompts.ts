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
    "Work with the available context even if it is incomplete.",
    "When context is missing, state your assumptions clearly and provide useful direction.",
    "Avoid asking clarifying questions that other participants have already asked.",
    "Provide concrete recommendations, tradeoffs, or next steps based on what you know.",
    "React to previous participants when useful.",
    "Add a new perspective from your role, mentioning agreement or disagreement when relevant.",
    "Avoid repeating what was already said.",
    "Keep it concise and conversational.",
    "Reply in 1-2 short sentences.",
    "Do not mention that you are an AI model.",
    "Do not prefix your response with your own role name.",
    'Do not write labels like "Skeptic:" or "Product Expert:" in the message body.',
    "The UI already shows the speaker name.",
    "Refer to other participants naturally, for example:",
    '"I agree with the Product Expert that..."',
    '"I\u2019d challenge the assumption about..."',
    "Do not write dialogue transcripts.",
    "Write only your own message as the selected AI instance.",
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
