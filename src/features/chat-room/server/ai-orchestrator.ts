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
  targetAIInstanceId?: string;
};

type GenerateAIResponsesResult = {
  messages: Message[];
};

export type StreamEvent =
  | { type: "chunk"; content: string }
  | { type: "done"; message: Message };

export async function generateAIResponses({
  latestUserMessage,
  aiInstances,
  recentMessages,
  mode = "reply",
  targetAIInstanceId,
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

  let instancesToRespond = selectTargetInstances(
    aiInstances,
    targetAIInstanceId,
  );

  if (!targetAIInstanceId && aiInstances.length > 1) {
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
        max_output_tokens: 90,
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

export async function* streamAIResponse({
  latestUserMessage,
  aiInstances,
  recentMessages,
  mode = "reply",
  targetAIInstanceId,
}: GenerateAIResponsesInput): AsyncGenerator<StreamEvent> {
  const roundId = createRoundId(mode, latestUserMessage);

  if (aiInstances.length === 0) {
    const mockResult = generateMockAIResponses({
      roundId,
      latestUserMessage,
      aiInstances,
      recentMessages,
      mode,
    });
    const message = mockResult.messages[0] ?? {
      id: `${roundId}-no-ai`,
      authorType: "system" as const,
      content: "No AI instances available.",
    };
    yield { type: "done", message };
    return;
  }

  let instancesToRespond = selectTargetInstances(
    aiInstances,
    targetAIInstanceId,
  );

  if (!targetAIInstanceId && aiInstances.length > 1) {
    const selection = await selectSpeaker({ aiInstances, recentMessages });
    const selected = aiInstances.find(
      (instance) => instance.id === selection.aiInstanceId,
    );
    instancesToRespond = selected ? [selected] : [aiInstances[0]];
  }

  const client = createOpenAIClient();
  const [instance] = instancesToRespond;

  if (!client || !instance) {
    const mockResult = generateMockAIResponses({
      roundId,
      latestUserMessage,
      aiInstances: instancesToRespond,
      recentMessages,
      mode,
    });
    const mockMessage = mockResult.messages[0];
    if (!mockMessage) {
      yield {
        type: "done",
        message: {
          id: `${roundId}-fallback`,
          authorType: "system" as const,
          content: fallbackEmptyResponse("AI"),
        },
      };
      return;
    }
    const content =
      mockMessage.authorType === "ai" && mockMessage.role
        ? cleanAIOutput(mockMessage.role, mockMessage.content)
        : mockMessage.content;
    for (const chunk of streamChunks(content)) {
      yield { type: "chunk", content: chunk };
    }
    yield {
      type: "done",
      message: { ...mockMessage, content },
    };
    return;
  }

  try {
    const workingMessages = [...recentMessages];
    const stream = await client.responses.create({
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
      max_output_tokens: 90,
      stream: true,
    });

    let accumulated = "";
    const messageId = `${roundId}-${instance.id}-openai-response`;

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        accumulated += event.delta;
        yield { type: "chunk", content: accumulated };
      }
    }

    const cleaned =
      cleanAIOutput(instance.name, accumulated.trim()) ||
      fallbackEmptyResponse(instance.name);
    const message: Message = {
      id: messageId,
      authorType: "ai",
      role: instance.name,
      content: cleaned,
    };

    yield { type: "done", message };
  } catch {
    const mockResult = generateMockAIResponses({
      roundId,
      latestUserMessage,
      aiInstances: instancesToRespond,
      recentMessages,
      mode,
    });
    const mockMessage = mockResult.messages[0];
    if (!mockMessage) {
      yield {
        type: "done",
        message: {
          id: `${roundId}-fallback`,
          authorType: "system" as const,
          content: fallbackEmptyResponse("AI"),
        },
      };
      return;
    }
    const content =
      mockMessage.authorType === "ai" && mockMessage.role
        ? cleanAIOutput(mockMessage.role, mockMessage.content)
        : mockMessage.content;
    for (const chunk of streamChunks(content)) {
      yield { type: "chunk", content: chunk };
    }
    yield {
      type: "done",
      message: { ...mockMessage, content },
    };
  }
}

function* streamChunks(text: string): Generator<string> {
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    yield words.slice(0, i + 1).join(" ");
  }
}

function selectTargetInstances(
  aiInstances: AIInstance[],
  targetAIInstanceId?: string,
) {
  if (!targetAIInstanceId) {
    return aiInstances;
  }

  const selected = aiInstances.find(
    (instance) => instance.id === targetAIInstanceId,
  );

  return selected ? [selected] : [aiInstances[0]];
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
