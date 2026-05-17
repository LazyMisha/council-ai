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

    expect(messages[0].content).toContain("technical angle");
    expect(messages[1].content).toContain("value case");
    expect(messages[2].content).toContain("weak assumption");
    expect(messages[3].content).toContain("upside");
    expect(messages[4].content).toContain("MVP");
    expect(messages[5].content).toContain("tradeoff");
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
    expect(messages[0].content).toContain("Legal Reviewer");
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
    expect(messages[0].content).toContain("still unresolved");
    expect(messages[1].content).toContain(
      "Building on Software Architect's point",
    );
  });
});
