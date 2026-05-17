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
      content: createRoleResponse(instance, latestUserMessage, workingMessages, mode),
    };

    messages.push(message);
    workingMessages.push(message);
  }

  return {
    messages,
  };
}

function createRoleResponse(
  instance: AIInstance,
  topic: string | undefined,
  workingMessages: Message[],
  mode: DiscussionMode,
) {
  const roleName = instance.name;
  const compactTopic = (topic ?? inferTopicFromMessages(workingMessages))
    .trim()
    .replace(/\s+/g, " ");
  const previousPoint = createPreviousPoint(workingMessages);
  const focus =
    mode === "continue"
      ? "What is still unclear?"
      : "";

  const predefined = predefinedRoles.find((pr) => pr.name === roleName);

  if (predefined) {
    const responses: Record<string, string> = {
      "Software Architect": `${previousPoint}Start with one clean integration boundary. ${focus}`,
      "Business Analyst": `${previousPoint}Can we validate demand before building more? ${focus}`,
      Skeptic: `${previousPoint}Have we tested the critical path? ${focus}`,
      Optimist: `${previousPoint}If the core loop works, the upside is real. ${focus}`,
      "Product Expert": `${previousPoint}Keep the MVP to one user moment. ${focus}`,
      Critic: `${previousPoint}What happens if the assumption fails? ${focus}`,
    };

    return responses[roleName].trim();
  }

  const instructionHint = createCustomInstructionHint(instance.instructions);
  return `${previousPoint}${instructionHint}For "${compactTopic}", pick one concrete risk or next step before going further. ${focus}`.trim();
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

function createCustomInstructionHint(instructions: string) {
  const compactInstructions = instructions.trim().replace(/\s+/g, " ");

  if (!compactInstructions) {
    return "";
  }

  const shortInstructions = compactInstructions.split(/\s+/).slice(0, 10).join(" ");

  return `From that angle, ${shortInstructions.toLowerCase()} `;
}
