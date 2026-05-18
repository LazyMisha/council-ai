import type { ChatRoom, RoleProfile } from "./types";

export const predefinedRoles: RoleProfile[] = [
  {
    name: "Software Architect",
    description: "Technical feasibility, tradeoffs, and system boundaries.",
    instructions:
      "Focus on technical feasibility, implementation tradeoffs, system boundaries, and risks in execution.",
  },
  {
    name: "Business Analyst",
    description: "Value, market demand, pricing, and validation signals.",
    instructions:
      "Focus on value, market demand, pricing, validation signals, and business tradeoffs.",
  },
  {
    name: "Skeptic",
    description: "Risks, weak assumptions, and failure modes.",
    instructions:
      "Focus on risks, weak assumptions, failure modes, and what could go wrong.",
  },
  {
    name: "Optimist",
    description: "Upside, opportunities, and momentum.",
    instructions:
      "Focus on upside, opportunities, momentum, and why this might work.",
  },
  {
    name: "Product Expert",
    description: "UX, MVP scope, and smallest useful product path.",
    instructions:
      "Focus on UX, MVP scope, user value, and the smallest useful product path.",
  },
  {
    name: "Critic",
    description: "Flaws, contradictions, and hard questions.",
    instructions:
      "Focus on flaws, contradictions, uncomfortable tradeoffs, and hard questions.",
  },
];

export function isPredefinedName(name: string): boolean {
  return predefinedRoles.some((role) => role.name === name);
}

export const initialChatRooms: ChatRoom[] = [];

export const summaryPlaceholder =
  "The final summary will appear here after the AI instances respond.";
