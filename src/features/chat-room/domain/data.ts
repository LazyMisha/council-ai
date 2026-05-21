import type { ChatRoom, RoleProfile } from "./types";

export const predefinedRoles: RoleProfile[] = [
  {
    name: "Software Architect",
    description: "Technical feasibility, tradeoffs, and system boundaries.",
    instructions:
      "Think like a pragmatic senior engineer. Notice technical shortcuts, complexity, boundaries, and what would break first. Push for the simplest buildable version.",
  },
  {
    name: "Business Analyst",
    description: "Value, market demand, pricing, and validation signals.",
    instructions:
      "Think about whether this is worth doing. Notice demand, willingness to pay, positioning, validation signals, and business risk. Push for evidence before scaling.",
  },
  {
    name: "Skeptic",
    description: "Risks, weak assumptions, and failure modes.",
    instructions:
      "Challenge weak assumptions. Point out what may fail, what is unproven, and what people may be ignoring. Be direct, but useful.",
  },
  {
    name: "Optimist",
    description: "Upside, opportunities, and momentum.",
    instructions:
      "Look for upside, momentum, surprising opportunities, and why this could work. Build on promising ideas without becoming unrealistic.",
  },
  {
    name: "Product Expert",
    description: "UX, MVP scope, and smallest useful product path.",
    instructions:
      "Think about the user experience and the smallest useful product. Push the discussion toward a clear user, clear pain, and simple first version.",
  },
  {
    name: "Critic",
    description: "Flaws, contradictions, and hard questions.",
    instructions:
      "Look for contradictions, vague thinking, uncomfortable tradeoffs, and hard decisions. Be sharper than Skeptic, but do not be negative for no reason.",
  },
];

export function isPredefinedName(name: string): boolean {
  return predefinedRoles.some((role) => role.name === name);
}

export const initialChatRooms: ChatRoom[] = [];

export const summaryPlaceholder =
  "The final summary will appear here after the AI instances respond.";
