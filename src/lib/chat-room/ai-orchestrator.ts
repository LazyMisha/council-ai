import OpenAI from "openai";
import { generateMockAIResponses } from "./mock-ai";
import { buildRoleInput, buildRoleInstructions } from "./role-prompts";
import type { AIInstance, Message } from "./types";

type GenerateAIResponsesInput = {
  latestUserMessage: string;
  aiInstances: AIInstance[];
  recentMessages: Message[];
};

type GenerateAIResponsesResult = {
  messages: Message[];
};

const model = "gpt-4o-mini";

export async function generateAIResponses({
  latestUserMessage,
  aiInstances,
  recentMessages,
}: GenerateAIResponsesInput): Promise<GenerateAIResponsesResult> {
  const userMessage = createUserMessage(latestUserMessage);

  if (aiInstances.length === 0 || !process.env.OPENAI_API_KEY) {
    return generateMockAIResponses({
      latestUserMessage: userMessage,
      aiInstances,
      recentMessages,
    });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const messages = await Promise.all(
      aiInstances.map(async (instance) => {
        const response = await client.responses.create({
          model,
          instructions: buildRoleInstructions(instance.role),
          input: buildRoleInput({
            latestUserMessage,
            recentMessages,
          }),
        });

        const content = response.output_text.trim();

        return {
          id: `${userMessage.id}-${instance.id}-openai-response`,
          authorType: "ai" as const,
          role: instance.role,
          content: content || fallbackEmptyResponse(instance.role),
        };
      }),
    );

    return { messages };
  } catch {
    return generateMockAIResponses({
      latestUserMessage: userMessage,
      aiInstances,
      recentMessages,
    });
  }
}

function createUserMessage(content: string): Message {
  return {
    id: `latest-user-message-${Date.now()}`,
    authorType: "user",
    content,
  };
}

function fallbackEmptyResponse(role: AIInstance["role"]) {
  return `${role} does not have a useful response yet.`;
}
