import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectFinish, fallbackDetectFinish } from "./finish-detector";
import type { AIInstance, Message } from "../domain/types";

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

describe("detectFinish", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    openAIResponsesCreate.mockReset();
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
  });

  const instances: AIInstance[] = [
    { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
    { id: "ai-2", name: "Optimist", instructions: "Focus on upside." },
  ];

  const recentMessages: Message[] = [
    { id: "msg-1", authorType: "user", content: "Should we launch?" },
    {
      id: "msg-2",
      authorType: "ai",
      role: "Skeptic",
      content: "The approval path is unclear.",
    },
    {
      id: "msg-3",
      authorType: "ai",
      role: "Optimist",
      content: "The upside is significant.",
    },
  ];

  it("returns ready_to_summarize when OpenAI decides discussion is mature", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text:
        '{"status": "ready_to_summarize", "reason": "Enough arguments and tradeoffs explored."}',
    });

    const result = await detectFinish({ aiInstances: instances, recentMessages });

    expect(result.status).toBe("ready_to_summarize");
    expect(result.reason).toContain("Enough arguments");
  });

  it("returns continue_discussion when OpenAI decides discussion is shallow", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text:
        '{"status": "continue_discussion", "reason": "Not enough perspectives yet."}',
    });

    const result = await detectFinish({ aiInstances: instances, recentMessages });

    expect(result.status).toBe("continue_discussion");
    expect(result.reason).toContain("Not enough perspectives");
  });

  it("uses fallback when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await detectFinish({ aiInstances: instances, recentMessages });

    expect(result.status).toBe("continue_discussion");
    expect(openAIResponsesCreate).not.toHaveBeenCalled();
  });

  it("uses fallback when OpenAI throws", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockRejectedValue(new Error("Network error"));

    const result = await detectFinish({ aiInstances: instances, recentMessages });

    expect(result.status).toBe("continue_discussion");
  });

  it("does not create a visible AI participant message", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text:
        '{"status": "ready_to_summarize", "reason": "Done"}',
    });

    const result = await detectFinish({ aiInstances: instances, recentMessages });

    expect(result).not.toHaveProperty("authorType");
    expect(result).not.toHaveProperty("content");
    expect(result).not.toHaveProperty("role");
  });

  it("instructs the finish detector to return only a short internal decision", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text:
        '{"status": "ready_to_summarize", "reason": "Enough tradeoffs explored"}',
    });

    await detectFinish({ aiInstances: instances, recentMessages });

    const call = openAIResponsesCreate.mock.calls[0][0];
    expect(call.instructions).toContain(
      "only decide whether summarization is available",
    );
    expect(call.instructions).toContain("Do not generate visible chat content, status copy, or summary text");
    expect(call.instructions).toContain("Keep reason under 12 words");
  });

  it("ignores unknown statuses from OpenAI and falls back", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text:
        '{"status": "needs_user_clarification", "reason": "Missing target user", "suggestedQuestion": "Who is the target user?"}',
    });

    const result = await detectFinish({ aiInstances: instances, recentMessages });

    expect(result.status).toBe("continue_discussion");
  });
});

describe("fallbackDetectFinish", () => {
  it("returns continue_discussion when fewer than 3 AI messages exist", () => {
    const messages: Message[] = [
      { id: "msg-1", authorType: "user", content: "Hello" },
      { id: "msg-2", authorType: "ai", role: "Skeptic", content: "Risky." },
    ];

    const result = fallbackDetectFinish(messages);

    expect(result.status).toBe("continue_discussion");
    expect(result.reason).toContain("shallow");
  });

  it("returns ready_to_summarize when 3 or more AI messages exist", () => {
    const messages: Message[] = [
      { id: "msg-1", authorType: "user", content: "Hello" },
      { id: "msg-2", authorType: "ai", role: "Skeptic", content: "A" },
      { id: "msg-3", authorType: "ai", role: "Optimist", content: "B" },
      { id: "msg-4", authorType: "ai", role: "Critic", content: "C" },
    ];

    const result = fallbackDetectFinish(messages);

    expect(result.status).toBe("ready_to_summarize");
    expect(result.reason).toContain("Multiple AI");
  });

  it("returns continue_discussion when no AI messages exist", () => {
    const messages: Message[] = [
      { id: "msg-1", authorType: "user", content: "Hello" },
    ];

    const result = fallbackDetectFinish(messages);

    expect(result.status).toBe("continue_discussion");
  });
});
