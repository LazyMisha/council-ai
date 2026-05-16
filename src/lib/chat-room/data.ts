import type { ChatRoom, RoleKey } from "./types";

export const availableRoles: RoleKey[] = [
  "Software Architect",
  "Business Analyst",
  "Skeptic",
  "Optimist",
  "Product Expert",
  "Critic",
];

export const initialChatRooms: ChatRoom[] = [
  {
    id: "partner-pilot-launch",
    title: "Partner pilot launch",
    aiInstances: [
      { id: "architect-initial", role: "Software Architect" },
      { id: "analyst-initial", role: "Business Analyst" },
      { id: "skeptic-initial", role: "Skeptic" },
    ],
    messages: [
      {
        id: "user-question",
        authorType: "user",
        content: "Should we launch the partner pilot this quarter?",
      },
      {
        id: "architect",
        authorType: "ai",
        role: "Software Architect",
        content: "Keep the first version limited to existing integrations.",
      },
      {
        id: "analyst",
        authorType: "ai",
        role: "Business Analyst",
        content:
          "The pilot is useful if success criteria are defined before launch.",
      },
      {
        id: "skeptic",
        authorType: "ai",
        role: "Skeptic",
        content: "The approval path is still the biggest risk.",
      },
    ],
  },
];

export const summaryPlaceholder =
  "The final summary will appear here after the AI instances respond.";
