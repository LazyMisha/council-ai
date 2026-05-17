import { describe, expect, it, vi } from "vitest";
import { fallbackSelectSpeaker, selectSpeaker } from "./speaker-selector";
import type { AIInstance, Message } from "./types";

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

describe("selectSpeaker", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
    openAIResponsesCreate.mockReset();
  });

  it("returns fallback when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      { id: "ai-2", name: "Optimist", instructions: "Focus on upside." },
    ];

    const result = await selectSpeaker({
      aiInstances: instances,
      recentMessages: [],
    });

    expect(result.aiInstanceId).toBe("ai-1");
    expect(result.reason).toContain("Deterministic fallback");
  });

  it("returns parsed selection when OpenAI returns valid JSON", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text:
        '{"aiInstanceId": "ai-2", "reason": "Can add business value"}',
    });

    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      { id: "ai-2", name: "Optimist", instructions: "Focus on upside." },
    ];

    const result = await selectSpeaker({
      aiInstances: instances,
      recentMessages: [],
    });

    expect(result.aiInstanceId).toBe("ai-2");
    expect(result.reason).toBe("Can add business value");
  });

  it("overrides with fallback when OpenAI selects the same recent speaker and alternatives exist", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text:
        '{"aiInstanceId": "ai-1", "reason": "Should speak again"}',
    });

    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      { id: "ai-2", name: "Optimist", instructions: "Focus on upside." },
    ];

    const messages: Message[] = [
      { id: "msg-1", authorType: "ai", role: "Skeptic", content: "Risky." },
    ];

    const result = await selectSpeaker({
      aiInstances: instances,
      recentMessages: messages,
    });

    expect(result.aiInstanceId).toBe("ai-2");
    expect(result.reason).toContain("Deterministic fallback");
  });

  it("allows same speaker when it is the only AI instance", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text:
        '{"aiInstanceId": "ai-1", "reason": "Only one available"}',
    });

    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
    ];

    const messages: Message[] = [
      { id: "msg-1", authorType: "ai", role: "Skeptic", content: "Risky." },
    ];

    const result = await selectSpeaker({
      aiInstances: instances,
      recentMessages: messages,
    });

    expect(result.aiInstanceId).toBe("ai-1");
    expect(result.reason).toBe("Only one available");
  });

  it("returns fallback when OpenAI returns invalid JSON", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: "I think the Skeptic should speak next.",
    });

    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      { id: "ai-2", name: "Optimist", instructions: "Focus on upside." },
    ];

    const result = await selectSpeaker({
      aiInstances: instances,
      recentMessages: [],
    });

    expect(result.aiInstanceId).toBe("ai-1");
    expect(result.reason).toContain("Deterministic fallback");
  });

  it("returns fallback when OpenAI returns an unknown aiInstanceId", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text:
        '{"aiInstanceId": "unknown-id", "reason": "Some reason"}',
    });

    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
    ];

    const result = await selectSpeaker({
      aiInstances: instances,
      recentMessages: [],
    });

    expect(result.aiInstanceId).toBe("ai-1");
    expect(result.reason).toContain("Only one AI instance");
  });

  it("returns fallback when OpenAI throws", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockRejectedValue(new Error("Network error"));

    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
    ];

    const result = await selectSpeaker({
      aiInstances: instances,
      recentMessages: [],
    });

    expect(result.aiInstanceId).toBe("ai-1");
    expect(result.reason).toContain("Only one AI instance");
  });

  it("does not create a visible chat message", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text:
        '{"aiInstanceId": "ai-1", "reason": "Challenges assumptions"}',
    });

    const result = await selectSpeaker({
      aiInstances: [{ id: "ai-1", name: "Skeptic", instructions: "Risks." }],
      recentMessages: [],
    });

    expect(result).not.toHaveProperty("content");
    expect(result).not.toHaveProperty("authorType");
    expect(result).not.toHaveProperty("role");
  });
});

describe("fallbackSelectSpeaker", () => {
  it("returns the first instance when no messages exist", () => {
    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      { id: "ai-2", name: "Optimist", instructions: "Focus on upside." },
    ];

    const result = fallbackSelectSpeaker(instances, []);

    expect(result.aiInstanceId).toBe("ai-1");
  });

  it("avoids selecting the same recent speaker when possible", () => {
    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      { id: "ai-2", name: "Optimist", instructions: "Focus on upside." },
    ];

    const messages: Message[] = [
      { id: "msg-1", authorType: "ai", role: "Skeptic", content: "Risky." },
    ];

    const result = fallbackSelectSpeaker(instances, messages);

    expect(result.aiInstanceId).toBe("ai-2");
  });

  it("prefers the instance that has spoken least recently", () => {
    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      { id: "ai-2", name: "Optimist", instructions: "Focus on upside." },
      { id: "ai-3", name: "Critic", instructions: "Focus on flaws." },
    ];

    const messages: Message[] = [
      { id: "msg-1", authorType: "ai", role: "Skeptic", content: "A" },
      { id: "msg-2", authorType: "ai", role: "Skeptic", content: "B" },
      { id: "msg-3", authorType: "ai", role: "Optimist", content: "C" },
    ];

    const result = fallbackSelectSpeaker(instances, messages);

    expect(result.aiInstanceId).toBe("ai-3");
  });

  it("breaks ties by total message count when last spoken index is the same", () => {
    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      { id: "ai-2", name: "Optimist", instructions: "Focus on upside." },
    ];

    const messages: Message[] = [
      { id: "msg-1", authorType: "ai", role: "Skeptic", content: "A" },
      { id: "msg-2", authorType: "ai", role: "Skeptic", content: "B" },
    ];

    const result = fallbackSelectSpeaker(instances, messages);

    expect(result.aiInstanceId).toBe("ai-2");
  });

  it("falls back to the first instance when all have spoken equally and none is recent", () => {
    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      { id: "ai-2", name: "Optimist", instructions: "Focus on upside." },
    ];

    const result = fallbackSelectSpeaker(instances, []);

    expect(result.aiInstanceId).toBe("ai-1");
  });

  it("returns the only instance when there is just one", () => {
    const instances: AIInstance[] = [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
    ];

    const result = fallbackSelectSpeaker(instances, []);

    expect(result.aiInstanceId).toBe("ai-1");
    expect(result.reason).toContain("Only one AI instance");
  });

  it("returns empty id when no instances exist", () => {
    const result = fallbackSelectSpeaker([], []);

    expect(result.aiInstanceId).toBe("");
  });
});
