import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateAIResponses } from "./ai-orchestrator";
import type { AIInstance, Message } from "../domain/types";

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
    expect(result.messages[0].content).toContain("tested the critical path");
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
    expect(result.messages[0].content).toContain("legal aspects");
    expect(result.messages[0].content).not.toContain("Legal Reviewer:");
  });

  it("selects one AI instance for a normal user message", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate
      .mockResolvedValueOnce({
        output_text:
          '{"aiInstanceId": "analyst", "reason": "Value angle is missing"}',
      })
      .mockResolvedValueOnce({ output_text: "Analyst response." });

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

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("Business Analyst");
    expect(result.messages[0].content).toBe("Analyst response.");
  });

  it("uses targetAIInstanceId to generate one selected AI response", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValueOnce({
      output_text: "Skeptic checks approval risk.",
    });

    const result = await generateAIResponses({
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
      targetAIInstanceId: "skeptic",
    });

    expect(openAIResponsesCreate).toHaveBeenCalledTimes(1);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("Skeptic");
    expect(result.messages[0].content).toBe("Skeptic checks approval risk.");
  });

  it("skips selector when targetAIInstanceId is provided", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: "Architect responds directly.",
    });

    const result = await generateAIResponses({
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
      targetAIInstanceId: "architect",
    });

    expect(openAIResponsesCreate).toHaveBeenCalledTimes(1);
    expect(result.messages[0].role).toBe("Software Architect");
  });

  it("continues discussion from existing context without a new user message", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: "Continue from unresolved risk.",
    });

    const result = await generateAIResponses({
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

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].authorType).toBe("ai");
    expect(result.messages[0].role).toBe("Skeptic");
    expect(result.messages[0].content).toBe("Continue from unresolved risk.");

    const responseCall = openAIResponsesCreate.mock.calls[0][0];
    expect(responseCall.instructions).toContain(
      "Continue the existing chat-room discussion",
    );
    expect(responseCall.input).toContain("Software Architect: Start small.");
    expect(responseCall.input).toContain("Do not wait for a new user message.");
    expect(responseCall.input).not.toContain("Latest user message:");
  });

  it("selects a single AI instance for continue mode when multiple instances exist", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate
      .mockResolvedValueOnce({
        output_text:
          '{"aiInstanceId": "analyst", "reason": "Business value angle is missing"}',
      })
      .mockResolvedValueOnce({
        output_text: "We should validate market fit first.",
      });

    const multiInstances: AIInstance[] = [
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
      mode: "continue",
      aiInstances: multiInstances,
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

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("Business Analyst");
    expect(result.messages[0].content).toBe(
      "We should validate market fit first.",
    );
  });

  it("falls back to mock for continue mode when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    const multiInstances: AIInstance[] = [
      {
        id: "architect",
        name: "Software Architect",
        instructions: "Tech.",
      },
      {
        id: "analyst",
        name: "Business Analyst",
        instructions: "Value.",
      },
    ];

    const result = await generateAIResponses({
      mode: "continue",
      aiInstances: multiInstances,
      recentMessages: [
        { id: "msg-1", authorType: "user", content: "Should we launch?" },
      ],
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].authorType).toBe("ai");
    expect(openAIResponsesCreate).not.toHaveBeenCalled();
  });

  it("normal user message flow uses smart speaker selection", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate
      .mockResolvedValueOnce({
        output_text:
          '{"aiInstanceId": "skeptic", "reason": "Risk check needed"}',
      })
      .mockResolvedValueOnce({ output_text: "Skeptic checks approval risk." });

    const multiInstances: AIInstance[] = [
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
      mode: "reply",
      latestUserMessage: "Should we launch?",
      aiInstances: multiInstances,
      recentMessages,
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("Skeptic");
  });

  it("selected AI instance receives full chat history", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: "The risk is still unresolved.",
    });

    const fullHistory: Message[] = [
      { id: "msg-1", authorType: "user", content: "Should we launch?" },
      {
        id: "msg-2",
        authorType: "ai",
        role: "Software Architect",
        content: "Start small.",
      },
      {
        id: "msg-3",
        authorType: "ai",
        role: "Business Analyst",
        content: "Validate market first.",
      },
    ];

    const result = await generateAIResponses({
      mode: "continue",
      aiInstances: [
        {
          id: "skeptic",
          name: "Skeptic",
          instructions: "Focus on risks.",
        },
      ],
      recentMessages: fullHistory,
    });

    expect(result.messages).toHaveLength(1);

    const responseCall = openAIResponsesCreate.mock.calls[0][0];
    expect(responseCall.input).toContain("Software Architect: Start small.");
    expect(responseCall.input).toContain(
      "Business Analyst: Validate market first.",
    );
    expect(responseCall.input).toContain("Should we launch?");
  });

  it("skips selector call when only one AI instance exists in continue mode", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: "I see only one path forward.",
    });

    const result = await generateAIResponses({
      mode: "continue",
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      ],
      recentMessages: [
        { id: "msg-1", authorType: "user", content: "Should we launch?" },
      ],
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("Skeptic");
    expect(openAIResponsesCreate).toHaveBeenCalledTimes(1);
  });

  it("calls selector when multiple AI instances exist in continue mode", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate
      .mockResolvedValueOnce({
        output_text:
          '{"aiInstanceId": "ai-2", "reason": "Fresh perspective needed"}',
      })
      .mockResolvedValueOnce({
        output_text: "I have a different take.",
      });

    const result = await generateAIResponses({
      mode: "continue",
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Risks." },
        { id: "ai-2", name: "Optimist", instructions: "Upside." },
      ],
      recentMessages: [
        { id: "msg-1", authorType: "user", content: "Should we launch?" },
      ],
    });

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("Optimist");
    expect(openAIResponsesCreate).toHaveBeenCalledTimes(2);
  });
});

describe("cleanAIOutput integration", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
  });

  it("strips a leading speaker label from OpenAI responses", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: "Skeptic: This is actually quite risky.",
    });

    const result = await generateAIResponses({
      latestUserMessage: "Should we launch?",
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      ],
      recentMessages: [],
    });

    expect(result.messages[0].content).toBe("This is actually quite risky.");
  });

  it("leaves content unchanged when no label is present", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: "This is risky without any label.",
    });

    const result = await generateAIResponses({
      latestUserMessage: "Should we launch?",
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      ],
      recentMessages: [],
    });

    expect(result.messages[0].content).toBe(
      "This is risky without any label.",
    );
  });
});
