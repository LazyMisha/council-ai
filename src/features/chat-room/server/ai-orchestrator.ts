import { generateMockAIResponses } from "./mock-ai";
import { chatRoomModel, createOpenAIClient } from "./openai";
import { cleanAIOutput } from "./output-cleanup";
import { buildRoleInput, buildRoleInstructions } from "./role-prompts";
import { selectSpeaker } from "./speaker-selector";
import type { DiscussionMode } from "./role-prompts";
import type { AIInstance, Message } from "../domain/types";

type GenerateAIResponsesInput = {
  latestUserMessage?: string;
  aiInstances: AIInstance[];
  recentMessages: Message[];
  mode?: DiscussionMode;
};

type GenerateAIResponsesResult = {
  messages: Message[];
};

export async function generateAIResponses({
  latestUserMessage,
  aiInstances,
  recentMessages,
  mode = "reply",
}: GenerateAIResponsesInput): Promise<GenerateAIResponsesResult> {
  const roundId = createRoundId(mode, latestUserMessage);

  if (aiInstances.length === 0) {
    return generateMockAIResponses({
      roundId,
      latestUserMessage,
      aiInstances,
      recentMessages,
      mode,
    });
  }

  let instancesToRespond = aiInstances;

  if (mode === "continue" && aiInstances.length > 1) {
    const selection = await selectSpeaker({ aiInstances, recentMessages });
    const selected = aiInstances.find(
      (instance) => instance.id === selection.aiInstanceId,
    );
    instancesToRespond = selected ? [selected] : [aiInstances[0]];
  }

  const client = createOpenAIClient();

  if (!client) {
    return cleanMockMessages(
      generateMockAIResponses({
        roundId,
        latestUserMessage,
        aiInstances: instancesToRespond,
        recentMessages,
        mode,
      }),
    );
  }

  try {
    const messages: Message[] = [];
    const workingMessages = [...recentMessages];

    for (const instance of instancesToRespond) {
      const response = await client.responses.create({
        model: chatRoomModel,
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

      const content = cleanAIOutput(
        instance.name,
        response.output_text.trim(),
      );
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
    return cleanMockMessages(
      generateMockAIResponses({
        roundId,
        latestUserMessage,
        aiInstances: instancesToRespond,
        recentMessages,
        mode,
      }),
    );
  }
}

function cleanMockMessages(result: { messages: Message[] }): {
  messages: Message[];
} {
  return {
    messages: result.messages.map((msg) =>
      msg.authorType === "ai" && msg.role
        ? { ...msg, content: cleanAIOutput(msg.role, msg.content) }
        : msg,
    ),
  };
}

function createRoundId(mode: DiscussionMode, latestUserMessage?: string) {
  const prefix = mode === "continue" ? "continue-discussion" : "user-message";
  const contentHint = latestUserMessage ? "latest" : "existing-context";

  return `${prefix}-${contentHint}-${Date.now()}`;
}

function fallbackEmptyResponse(roleName: string) {
  return `${roleName} does not have a useful response yet.`;
}
