import { describe, expect, it, vi } from "vitest";
import { generateAIResponses } from "./ai-orchestrator";
import type { AIInstance, Message } from "./types";

const instances: AIInstance[] = [
  { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
];

const recentMessages: Message[] = [
  { id: "msg-1", authorType: "user", content: "Should we launch?" },
];

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      responses = {
        create: vi.fn().mockResolvedValue({ output_text: "" }),
      };
    },
  };
});

describe("generateAIResponses", () => {
  it("falls back to mock responses when OPENAI_API_KEY is missing", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await generateAIResponses({
      latestUserMessage: "Should we launch?",
      aiInstances: instances,
      recentMessages,
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].authorType).toBe("ai");
    expect(result.messages[0].role).toBe("Skeptic");
    expect(result.messages[0].content).toContain("weak assumption");

    process.env.OPENAI_API_KEY = originalKey;
  });

  it("returns a system hint when no AI instances exist and no API key is set", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const result = await generateAIResponses({
      latestUserMessage: "Should we launch?",
      aiInstances: [],
      recentMessages,
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].authorType).toBe("system");
    expect(result.messages[0].content).toBe(
      "Add AI instances to start a discussion.",
    );

    process.env.OPENAI_API_KEY = originalKey;
  });

  it("uses the fallback empty response when OpenAI returns empty text", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";

    const result = await generateAIResponses({
      latestUserMessage: "Should we launch?",
      aiInstances: instances,
      recentMessages,
    });

    expect(result.messages[0].content).toBe(
      "Skeptic does not have a useful response yet.",
    );

    process.env.OPENAI_API_KEY = originalKey;
  });

  it("returns a generic mock response for a custom AI instance", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const customInstances: AIInstance[] = [
      {
        id: "ai-custom",
        name: "Legal Reviewer",
        instructions: "Review legal aspects.",
      },
    ];

    const result = await generateAIResponses({
      latestUserMessage: "Should we sign the contract?",
      aiInstances: customInstances,
      recentMessages,
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].authorType).toBe("ai");
    expect(result.messages[0].role).toBe("Legal Reviewer");
    expect(result.messages[0].content).toContain("Legal Reviewer");

    process.env.OPENAI_API_KEY = originalKey;
  });
});
