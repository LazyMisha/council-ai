import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateAIResponses } from "./ai-orchestrator";
import type { AIInstance, Message } from "./types";

const instances: AIInstance[] = [
  { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
];

const recentMessages: Message[] = [
  { id: "msg-1", authorType: "user", content: "Should we launch?" },
];

const openAIResponsesCreate = vi.hoisted(() => vi.fn());

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      responses = {
        create: openAIResponsesCreate,
      };
    },
  };
});

describe("generateAIResponses", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    openAIResponsesCreate.mockReset();
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
  });

  it("falls back to mock responses when OPENAI_API_KEY is missing", async () => {
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
  });

  it("does not generate AI messages when no AI instances exist", async () => {
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
    expect(result.messages.some((message) => message.authorType === "ai")).toBe(
      false,
    );
  });

  it("uses the fallback empty response when OpenAI returns empty text", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({ output_text: "" });

    const result = await generateAIResponses({
      latestUserMessage: "Should we launch?",
      aiInstances: instances,
      recentMessages,
    });

    expect(result.messages[0].content).toBe(
      "Skeptic does not have a useful response yet.",
    );
  });

  it("returns a generic mock response for a custom AI instance", async () => {
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
  });

  it("generates real AI responses in the active AI instance order", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate
      .mockResolvedValueOnce({ output_text: "Architect response." })
      .mockResolvedValueOnce({ output_text: "Analyst response." })
      .mockResolvedValueOnce({ output_text: "Skeptic response." });

    const orderedInstances: AIInstance[] = [
      {
        id: "architect",
        name: "Software Architect",
        instructions: "Focus on technical feasibility.",
      },
      {
        id: "analyst",
        name: "Business Analyst",
        instructions: "Focus on value.",
      },
      {
        id: "skeptic",
        name: "Skeptic",
        instructions: "Focus on risks.",
      },
    ];

    const result = await generateAIResponses({
      latestUserMessage: "Should we launch?",
      aiInstances: orderedInstances,
      recentMessages,
    });

    expect(result.messages.map((message) => message.role)).toEqual([
      "Software Architect",
      "Business Analyst",
      "Skeptic",
    ]);
    expect(result.messages.map((message) => message.content)).toEqual([
      "Architect response.",
      "Analyst response.",
      "Skeptic response.",
    ]);
  });

  it("passes previous AI responses from the same round to later AI instances", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate
      .mockResolvedValueOnce({ output_text: "Architect says start small." })
      .mockResolvedValueOnce({ output_text: "Analyst adds success metrics." })
      .mockResolvedValueOnce({ output_text: "Skeptic checks approval risk." });

    await generateAIResponses({
      latestUserMessage: "Should we launch?",
      aiInstances: [
        {
          id: "architect",
          name: "Software Architect",
          instructions: "Focus on technical feasibility.",
        },
        {
          id: "analyst",
          name: "Business Analyst",
          instructions: "Focus on value.",
        },
        {
          id: "skeptic",
          name: "Skeptic",
          instructions: "Focus on risks.",
        },
      ],
      recentMessages,
    });

    const firstInput = openAIResponsesCreate.mock.calls[0][0].input as string;
    const secondInput = openAIResponsesCreate.mock.calls[1][0].input as string;
    const thirdInput = openAIResponsesCreate.mock.calls[2][0].input as string;

    expect(firstInput).not.toContain("Architect says start small.");
    expect(secondInput).toContain(
      "Software Architect: Architect says start small.",
    );
    expect(secondInput).not.toContain("Analyst adds success metrics.");
    expect(thirdInput).toContain(
      "Software Architect: Architect says start small.",
    );
    expect(thirdInput).toContain(
      "Business Analyst: Analyst adds success metrics.",
    );
  });

  it("waits for each response before generating the next AI response", async () => {
    process.env.OPENAI_API_KEY = "test-key";

    let activeCalls = 0;
    let maxActiveCalls = 0;

    openAIResponsesCreate.mockImplementation(async () => {
      activeCalls += 1;
      maxActiveCalls = Math.max(maxActiveCalls, activeCalls);

      await Promise.resolve();

      activeCalls -= 1;
      return { output_text: `Response ${openAIResponsesCreate.mock.calls.length}` };
    });

    await generateAIResponses({
      latestUserMessage: "Should we launch?",
      aiInstances: [
        {
          id: "architect",
          name: "Software Architect",
          instructions: "Focus on technical feasibility.",
        },
        {
          id: "analyst",
          name: "Business Analyst",
          instructions: "Focus on value.",
        },
        {
          id: "skeptic",
          name: "Skeptic",
          instructions: "Focus on risks.",
        },
      ],
      recentMessages,
    });

    expect(openAIResponsesCreate).toHaveBeenCalledTimes(3);
    expect(maxActiveCalls).toBe(1);
  });

  it("continues discussion from existing context without a new user message", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: "Continue from unresolved risk.",
    });

    await generateAIResponses({
      mode: "continue",
      aiInstances: instances,
      recentMessages: [
        { id: "msg-1", authorType: "user", content: "Should we launch?" },
        {
          id: "msg-2",
          authorType: "ai",
          role: "Software Architect",
          content: "Start small.",
        },
      ],
    });

    const call = openAIResponsesCreate.mock.calls[0][0];

    expect(call.instructions).toContain(
      "Continue the existing chat-room discussion",
    );
    expect(call.input).toContain("Software Architect: Start small.");
    expect(call.input).toContain("Do not wait for a new user message.");
    expect(call.input).not.toContain("Latest user message:");
  });
});
