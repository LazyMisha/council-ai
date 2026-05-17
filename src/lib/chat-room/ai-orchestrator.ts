import OpenAI from "openai";
import { generateMockAIResponses } from "./mock-ai";
import { buildRoleInput, buildRoleInstructions } from "./role-prompts";
import type { DiscussionMode } from "./role-prompts";
import type { AIInstance, Message } from "./types";

type GenerateAIResponsesInput = {
  latestUserMessage?: string;
  aiInstances: AIInstance[];
  recentMessages: Message[];
  mode?: DiscussionMode;
};

type GenerateAIResponsesResult = {
  messages: Message[];
};

const model = "gpt-4o-mini";

export async function generateAIResponses({
  latestUserMessage,
  aiInstances,
  recentMessages,
  mode = "reply",
}: GenerateAIResponsesInput): Promise<GenerateAIResponsesResult> {
  const roundId = createRoundId(mode, latestUserMessage);

  if (aiInstances.length === 0 || !process.env.OPENAI_API_KEY) {
    return generateMockAIResponses({
      roundId,
      latestUserMessage,
      aiInstances,
      recentMessages,
      mode,
    });
  }

  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const messages: Message[] = [];
    const workingMessages = [...recentMessages];

    for (const instance of aiInstances) {
      const response = await client.responses.create({
        model,
        instructions: buildRoleInstructions({
          name: instance.name,
          instructions: instance.instructions,
          mode,
        }),
        input: buildRoleInput({
          latestUserMessage,
          recentMessages: workingMessages,
          mode,
        }),
      });

      const content = response.output_text.trim();
      const message: Message = {
        id: `${roundId}-${instance.id}-openai-response`,
        authorType: "ai",
        role: instance.name,
        content: content || fallbackEmptyResponse(instance.name),
      };

      messages.push(message);
      workingMessages.push(message);
    }

    return { messages };
  } catch {
    return generateMockAIResponses({
      roundId,
      latestUserMessage,
      aiInstances,
      recentMessages,
      mode,
    });
  }
}

function createRoundId(mode: DiscussionMode, latestUserMessage?: string) {
  const prefix = mode === "continue" ? "continue-discussion" : "user-message";
  const contentHint = latestUserMessage ? "latest" : "existing-context";

  return `${prefix}-${contentHint}-${Date.now()}`;
}

function fallbackEmptyResponse(roleName: string) {
  return `${roleName} does not have a useful response yet.`;
}
