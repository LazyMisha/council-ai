import { predefinedRoles } from "./data";
import type { DiscussionMode } from "./role-prompts";
import type { AIInstance, Message } from "./types";

export const noAIInstancesHint = "Add AI instances to start a discussion.";

type GenerateMockAIResponsesInput = {
  roundId: string;
  latestUserMessage?: string;
  aiInstances: AIInstance[];
  recentMessages?: Message[];
  mode?: DiscussionMode;
};

type GenerateMockAIResponsesResult = {
  messages: Message[];
  hint?: string;
};

export function generateMockAIResponses({
  roundId,
  latestUserMessage,
  aiInstances,
  recentMessages,
  mode = "reply",
}: GenerateMockAIResponsesInput): GenerateMockAIResponsesResult {
  if (aiInstances.length === 0) {
    return {
      messages: [
        {
          id: `${roundId}-no-ai-instances`,
          authorType: "system",
          content: noAIInstancesHint,
        },
      ],
      hint: noAIInstancesHint,
    };
  }

  const messages: Message[] = [];
  const workingMessages = recentMessages ? [...recentMessages] : [];

  for (const instance of aiInstances) {
    const message: Message = {
      id: `${roundId}-${instance.id}-response`,
      authorType: "ai",
      role: instance.name,
      content: createRoleResponse(
        instance.name,
        latestUserMessage,
        workingMessages,
        mode,
      ),
    };

    messages.push(message);
    workingMessages.push(message);
  }

  return {
    messages,
  };
}

function createRoleResponse(
  roleName: string,
  topic: string | undefined,
  workingMessages: Message[],
  mode: DiscussionMode,
) {
  const compactTopic = (topic ?? inferTopicFromMessages(workingMessages))
    .trim()
    .replace(/\s+/g, " ");
  const previousPoint = createPreviousPoint(workingMessages);
  const focus =
    mode === "continue"
      ? "Focus on what is still unresolved and move the discussion toward a decision."
      : "";

  const predefined = predefinedRoles.find((pr) => pr.name === roleName);

  if (predefined) {
    const responses: Record<string, string> = {
      "Software Architect": `${previousPoint}From a technical angle, "${compactTopic}" should start with the smallest implementation path and clear integration boundaries. ${focus}`,
      "Business Analyst": `${previousPoint}The value case for "${compactTopic}" depends on validation signals, market timing, and whether success can be measured quickly. ${focus}`,
      Skeptic: `${previousPoint}The weak assumption in "${compactTopic}" is that the main risk is already known. Pressure-test dependencies before committing. ${focus}`,
      Optimist: `${previousPoint}"${compactTopic}" has upside if the team keeps momentum and turns early interest into visible opportunities. ${focus}`,
      "Product Expert": `${previousPoint}For "${compactTopic}", keep the MVP focused on the core user moment and avoid adding UX surface area too early. ${focus}`,
      Critic: `${previousPoint}The tradeoff in "${compactTopic}" is that clarity may expose flaws. Name those flaws before they become product debt. ${focus}`,
    };

    return responses[roleName].trim();
  }

  return `${previousPoint}${roleName} sees "${compactTopic}" as a topic worth examining from their specific perspective. ${focus}`.trim();
}

function createPreviousPoint(workingMessages: Message[]) {
  let previousRole: string | undefined;

  for (const message of workingMessages) {
    if (message.authorType === "ai" && message.role) {
      previousRole = message.role;
    }
  }

  if (!previousRole) {
    return "";
  }

  return `Building on ${previousRole}'s point, `;
}

function inferTopicFromMessages(messages: Message[]) {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.authorType === "user");

  return latestUserMessage?.content ?? "this discussion";
}
