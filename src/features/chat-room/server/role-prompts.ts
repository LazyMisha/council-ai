import type { Message } from "../domain/types";
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
          "Continue the existing room discussion.",
          "Do not wait for the user.",
          "React to the latest useful point from another participant.",
          "Focus on unresolved issues, disagreements, assumptions, or next steps.",
        ]
      : [
          "The user message is the discussion topic for the room.",
          "Do not answer it like a personal assistant.",
          "Start or continue the room discussion from your role's point of view.",
          "Speak to the room, not directly to the user.",
        ];

  return [
    `You are ${name}, one participant in a CouncilAI discussion room.`,
    "You are not the user's assistant.",
    "You are not a moderator.",
    "You are not writing a report.",
    "You are discussing the topic with the other AI participants.",
    "Your role defines what you notice, not your writing format.",
    instructions,
    "Respect custom role instructions for focus and point of view, but the concise chat-room style and word limits always win.",
    "Read the conversation before replying.",
    ...modeInstructions,
    "Do not repeat what was already said.",
    "Do not summarize the whole discussion.",
    "Do not try to cover every angle.",
    "Add one useful point from your role.",
    "If context is missing, make a small assumption and continue.",
    "Do not turn the discussion into a user interview.",
    "If a missing detail blocks useful discussion, ask the user one concise clarification question.",
    "Only ask the user when your role cannot make progress with a small stated assumption.",
    "If you need to challenge something, challenge another participant's point.",
    ...visibleAIStyleInstructions,
    "Refer to other participants naturally, for example:",
    '"I agree with the Product Expert that..."',
    "\"I'd challenge the assumption about...\"",
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
      "Room conversation so far, oldest to newest:",
      recentContext || "No previous messages.",
      "",
      "Your task:",
      "- Continue the discussion with the other participants.",
      "- React to the latest useful point.",
      "- Ask the user a concise clarification question only when the room is blocked.",
    ].join("\n");
  }

  return [
    "Room conversation so far, oldest to newest:",
    recentContext || "No previous messages.",
    "",
    "Topic started by the user:",
    latestUserMessage ?? "",
    "",
    "Your task:",
    "- Contribute to the room discussion as one participant.",
    "- Do not answer the user directly unless a blocking clarification question is needed.",
    "- Ask the user a concise clarification question only when the room is blocked.",
  ].join("\n");
}
