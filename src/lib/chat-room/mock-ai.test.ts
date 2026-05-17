import { generateMockAIResponses } from "./mock-ai";
import type { AIInstance, Message } from "./types";

const latestUserMessage: Message = {
  id: "message-1",
  authorType: "user",
  content: "Launch pilot",
};

const predefinedInstances: AIInstance[] = [
  {
    id: "ai-0",
    name: "Software Architect",
    instructions: "Focus on technical feasibility.",
  },
  {
    id: "ai-1",
    name: "Business Analyst",
    instructions: "Focus on business value.",
  },
  {
    id: "ai-2",
    name: "Skeptic",
    instructions: "Focus on risks.",
  },
  {
    id: "ai-3",
    name: "Optimist",
    instructions: "Focus on upside.",
  },
  {
    id: "ai-4",
    name: "Product Expert",
    instructions: "Focus on UX.",
  },
  {
    id: "ai-5",
    name: "Critic",
    instructions: "Focus on flaws.",
  },
];

describe("generateMockAIResponses", () => {
  it("returns a hint and no messages when no AI instances exist", () => {
    expect(
      generateMockAIResponses({
        roundId: latestUserMessage.id,
        latestUserMessage: latestUserMessage.content,
        aiInstances: [],
      }),
    ).toEqual({
      messages: [
        {
          id: "message-1-no-ai-instances",
          authorType: "system",
          content: "Add AI instances to start a discussion.",
        },
      ],
      hint: "Add AI instances to start a discussion.",
    });
  });

  it("creates one AI message for each AI instance", () => {
    const { messages, hint } = generateMockAIResponses({
      roundId: latestUserMessage.id,
      latestUserMessage: latestUserMessage.content,
      aiInstances: predefinedInstances,
      recentMessages: [],
    });

    expect(hint).toBeUndefined();
    expect(messages).toHaveLength(predefinedInstances.length);
    expect(messages.map((message) => message.role)).toEqual(
      predefinedInstances.map((instance) => instance.name),
    );
    expect(messages.every((message) => message.authorType === "ai")).toBe(true);
  });

  it("creates mock responses in order with earlier round responses visible", () => {
    const { messages } = generateMockAIResponses({
      roundId: latestUserMessage.id,
      latestUserMessage: latestUserMessage.content,
      aiInstances: [
        predefinedInstances[0],
        predefinedInstances[5],
        predefinedInstances[2],
      ],
      recentMessages: [latestUserMessage],
    });

    expect(messages.map((message) => message.role)).toEqual([
      "Software Architect",
      "Critic",
      "Skeptic",
    ]);
    expect(messages[0].content).not.toContain("Building on");
    expect(messages[1].content).toContain(
      "Building on Software Architect's point",
    );
    expect(messages[2].content).toContain("Building on Critic's point");
  });

  it("keeps mock responses role-specific for predefined roles", () => {
    const { messages } = generateMockAIResponses({
      roundId: latestUserMessage.id,
      latestUserMessage: latestUserMessage.content,
      aiInstances: predefinedInstances,
    });

    expect(messages[0].content).toContain("one clean integration boundary");
    expect(messages[1].content).toContain("validate demand");
    expect(messages[2].content).toContain("tested the critical path");
    expect(messages[3].content).toContain("upside is real");
    expect(messages[4].content).toContain("one user moment");
    expect(messages[5].content).toContain("assumption fails");
  });

  it("creates short mock responses", () => {
    const { messages } = generateMockAIResponses({
      roundId: latestUserMessage.id,
      latestUserMessage: latestUserMessage.content,
      aiInstances: predefinedInstances,
    });

    for (const message of messages) {
      const words = message.content.split(/\s+/).filter((w) => w.length > 0);
      expect(words.length).toBeLessThanOrEqual(20);
    }
  });

  it("creates a generic response for custom AI instances", () => {
    const customInstance: AIInstance = {
      id: "ai-custom",
      name: "Legal Reviewer",
      instructions: "Review from a legal perspective.",
    };

    const { messages } = generateMockAIResponses({
      roundId: latestUserMessage.id,
      latestUserMessage: latestUserMessage.content,
      aiInstances: [customInstance],
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("Legal Reviewer");
    expect(messages[0].content).toContain("legal perspective");
    expect(messages[0].content).not.toContain("Legal Reviewer:");
  });

  it("keeps custom mock responses under the visible AI word limit", () => {
    const customInstance: AIInstance = {
      id: "ai-custom",
      name: "Longform Expert",
      instructions:
        "Write a comprehensive, detailed, heavily structured answer with extensive context and examples.",
    };

    const { messages } = generateMockAIResponses({
      roundId: latestUserMessage.id,
      latestUserMessage: latestUserMessage.content,
      aiInstances: [customInstance],
    });

    const words = messages[0].content.split(/\s+/).filter((w) => w.length > 0);
    expect(words.length).toBeLessThanOrEqual(80);
  });

  it("continues from existing context without a new user message", () => {
    const { messages } = generateMockAIResponses({
      roundId: "continue-round",
      mode: "continue",
      aiInstances: [predefinedInstances[0], predefinedInstances[2]],
      recentMessages: [
        latestUserMessage,
        {
          id: "ai-existing",
          authorType: "ai",
          role: "Business Analyst",
          content: "We still need success metrics.",
        },
      ],
    });

    expect(messages).toHaveLength(2);
    expect(messages[0].content).toContain(
      "Building on Business Analyst's point",
    );
    expect(messages[0].content).toContain("still unclear");
    expect(messages[1].content).toContain(
      "Building on Software Architect's point",
    );
  });
});
