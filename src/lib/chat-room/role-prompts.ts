import type { Message, RoleKey } from "./types";

const roleInstructions: Record<RoleKey, string> = {
  "Software Architect":
    "Focus on technical feasibility, implementation tradeoffs, system boundaries, and risks in execution.",
  "Business Analyst":
    "Focus on value, market demand, pricing, validation signals, and business tradeoffs.",
  Skeptic:
    "Focus on risks, weak assumptions, failure modes, and what could go wrong.",
  Optimist:
    "Focus on upside, opportunities, momentum, and why this might work.",
  "Product Expert":
    "Focus on UX, MVP scope, user value, and the smallest useful product path.",
  Critic:
    "Focus on flaws, contradictions, uncomfortable tradeoffs, and hard questions.",
};

export function getRolePrompt(role: RoleKey) {
  return roleInstructions[role];
}

export function buildRoleInstructions(role: RoleKey) {
  return [
    `You are the ${role} AI instance in a CouncilAI chat room.`,
    getRolePrompt(role),
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
