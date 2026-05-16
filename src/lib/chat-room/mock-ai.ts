import type { AIInstance, Message, RoleKey } from "./types";

export const noAIInstancesHint = "Add AI instances to start a discussion.";

type GenerateMockAIResponsesInput = {
  latestUserMessage: Message;
  aiInstances: AIInstance[];
  recentMessages?: Message[];
};

type GenerateMockAIResponsesResult = {
  messages: Message[];
  hint?: string;
};

export function generateMockAIResponses({
  latestUserMessage,
  aiInstances,
}: GenerateMockAIResponsesInput): GenerateMockAIResponsesResult {
  if (aiInstances.length === 0) {
    return {
      messages: [
        {
          id: `${latestUserMessage.id}-no-ai-instances`,
          authorType: "system",
          content: noAIInstancesHint,
        },
      ],
      hint: noAIInstancesHint,
    };
  }

  return {
    messages: aiInstances.map((instance) => ({
      id: `${latestUserMessage.id}-${instance.id}-response`,
      authorType: "ai",
      role: instance.role,
      content: createRoleResponse(instance.role, latestUserMessage.content),
    })),
  };
}

function createRoleResponse(role: RoleKey, topic: string) {
  const compactTopic = topic.trim().replace(/\s+/g, " ");

  const responses: Record<RoleKey, string> = {
    "Software Architect": `From a technical angle, "${compactTopic}" should start with the smallest implementation path and clear integration boundaries.`,
    "Business Analyst": `The value case for "${compactTopic}" depends on validation signals, market timing, and whether success can be measured quickly.`,
    Skeptic: `The weak assumption in "${compactTopic}" is that the main risk is already known. Pressure-test dependencies before committing.`,
    Optimist: `"${compactTopic}" has upside if the team keeps momentum and turns early interest into visible opportunities.`,
    "Product Expert": `For "${compactTopic}", keep the MVP focused on the core user moment and avoid adding UX surface area too early.`,
    Critic: `The tradeoff in "${compactTopic}" is that clarity may expose flaws. Name those flaws before they become product debt.`,
  };

  return responses[role];
}
