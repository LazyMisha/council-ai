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
        latestUserMessage,
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
      latestUserMessage,
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

  it("keeps mock responses role-specific for predefined roles", () => {
    const { messages } = generateMockAIResponses({
      latestUserMessage,
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
      latestUserMessage,
      aiInstances: [customInstance],
    });

    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("Legal Reviewer");
    expect(messages[0].content).toContain("Legal Reviewer");
  });
});
