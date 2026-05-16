import { generateMockAIResponses } from "./mock-ai";
import type { AIInstance, Message, RoleKey } from "./types";

const latestUserMessage: Message = {
  id: "message-1",
  authorType: "user",
  content: "Launch pilot",
};

const roles: RoleKey[] = [
  "Software Architect",
  "Business Analyst",
  "Skeptic",
  "Optimist",
  "Product Expert",
  "Critic",
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
    const aiInstances: AIInstance[] = roles.map((role, index) => ({
      id: `ai-${index}`,
      role,
    }));

    const { messages, hint } = generateMockAIResponses({
      latestUserMessage,
      aiInstances,
      recentMessages: [],
    });

    expect(hint).toBeUndefined();
    expect(messages).toHaveLength(roles.length);
    expect(messages.map((message) => message.role)).toEqual(roles);
    expect(messages.every((message) => message.authorType === "ai")).toBe(true);
  });

  it("keeps mock responses role-specific", () => {
    const aiInstances: AIInstance[] = roles.map((role, index) => ({
      id: `ai-${index}`,
      role,
    }));

    const { messages } = generateMockAIResponses({
      latestUserMessage,
      aiInstances,
    });

    expect(messages[0].content).toContain("technical angle");
    expect(messages[1].content).toContain("value case");
    expect(messages[2].content).toContain("weak assumption");
    expect(messages[3].content).toContain("upside");
    expect(messages[4].content).toContain("MVP");
    expect(messages[5].content).toContain("tradeoff");
  });
});
