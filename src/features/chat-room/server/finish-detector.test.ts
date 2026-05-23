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

  const recentMessages: Message[] = createMessagesWithAIContributions(10);

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

    expect(result.status).toBe("ready_to_summarize");
    expect(openAIResponsesCreate).not.toHaveBeenCalled();
  });

  it("continues without calling OpenAI before 10 AI messages", async () => {
    process.env.OPENAI_API_KEY = "test-key";

    const result = await detectFinish({
      aiInstances: instances,
      recentMessages: createMessagesWithAIContributions(9),
    });

    expect(result.status).toBe("continue_discussion");
    expect(result.reason).toContain("10 AI messages");
    expect(openAIResponsesCreate).not.toHaveBeenCalled();
  });

  it("returns user input request after 10 AI messages when questions block summary", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        status: "needs_user_input",
        reason: "Blocking questions remain",
        summary:
          "The AI instances agree launch timing depends on segment priority and evidence.",
        questions: [
          "Which customer segment matters most?",
          "What launch constraint is immovable?",
          "What evidence supports demand?",
          "Ignored extra question?",
        ],
      }),
    });

    const result = await detectFinish({
      aiInstances: instances,
      recentMessages: createMessagesWithAIContributions(10, undefined, {
        questionAt: 4,
      }),
    });

    expect(result.status).toBe("needs_user_input");
    if (result.status !== "needs_user_input") {
      throw new Error("Expected finish detector to request user input.");
    }
    expect(result.summary).toContain("launch timing depends");
    expect(result.questions).toEqual([
      "Which customer segment matters most?",
      "What launch constraint is immovable?",
      "What evidence supports demand?",
    ]);
  });

  it("uses fallback when OpenAI throws", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockRejectedValue(new Error("Network error"));

    const result = await detectFinish({ aiInstances: instances, recentMessages });

    expect(result.status).toBe("ready_to_summarize");
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
      "continue, can be summarized, or needs user input",
    );
    expect(call.instructions).toContain(
      "Do not generate chat messages or status copy outside the JSON object",
    );
    expect(call.instructions).toContain("fewer than 10 AI messages");
    expect(call.instructions).toContain("needs_user_input");
    expect(call.instructions).toContain("summary");
    expect(call.instructions).toContain("at least two different AI roles contributed");
    expect(call.instructions).toContain("at least one participant reacted to another participant");
    expect(call.instructions).toContain("roles gave isolated answers to the user");
    expect(call.instructions).toContain("Keep reason under 12 words");
    expect(call.instructions).toContain("Keep needs_user_input summary under 35 words");
    expect(call.max_output_tokens).toBe(300);
  });

  it("ignores unknown statuses from OpenAI and falls back", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text:
        '{"status": "needs_user_clarification", "reason": "Missing target user", "suggestedQuestion": "Who is the target user?"}',
    });

    const result = await detectFinish({ aiInstances: instances, recentMessages });

    expect(result.status).toBe("ready_to_summarize");
  });

  it("does not let finish detector invent user questions", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        status: "needs_user_input",
        reason: "Missing target user",
        summary: "The discussion has not settled the target user.",
        questions: ["Who is the target user?"],
      }),
    });

    const result = await detectFinish({
      aiInstances: instances,
      recentMessages: createMessagesWithAIContributions(10),
    });

    expect(result.status).toBe("continue_discussion");
    expect(result.reason).toContain("No AI user questions");
  });

  it("uses a fallback summary when user input requests omit a summary", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: JSON.stringify({
        status: "needs_user_input",
        reason: "Blocking questions remain",
        questions: ["Which customer segment matters most?"],
      }),
    });

    const result = await detectFinish({
      aiInstances: instances,
      recentMessages: createMessagesWithAIContributions(10, undefined, {
        questionAt: 4,
      }),
    });

    expect(result.status).toBe("needs_user_input");
    if (result.status !== "needs_user_input") {
      throw new Error("Expected finish detector to request user input.");
    }
    expect(result.summary).toContain("unresolved user questions");
    expect(result.questions).toEqual(["Which customer segment matters most?"]);
  });
});

describe("fallbackDetectFinish", () => {
  it("returns continue_discussion when fewer than 10 AI messages exist", () => {
    const messages = createMessagesWithAIContributions(9);

    const result = fallbackDetectFinish(messages);

    expect(result.status).toBe("continue_discussion");
    expect(result.reason).toContain("10 AI messages");
  });

  it("returns continue_discussion when fewer than 3 roles have contributed", () => {
    const messages = createMessagesWithAIContributions(10, [
      "Skeptic",
      "Optimist",
    ]);

    const result = fallbackDetectFinish(messages);

    expect(result.status).toBe("continue_discussion");
    expect(result.reason).toContain("distinct AI roles");
  });

  it("returns ready_to_summarize after 10 AI messages from 3 roles", () => {
    const messages = createMessagesWithAIContributions(10);

    const result = fallbackDetectFinish(messages);

    expect(result.status).toBe("ready_to_summarize");
    expect(result.reason).toContain("distinct roles");
  });

  it("returns continue_discussion when no AI messages exist", () => {
    const messages: Message[] = [
      { id: "msg-1", authorType: "user", content: "Hello" },
    ];

    const result = fallbackDetectFinish(messages);

    expect(result.status).toBe("continue_discussion");
  });
});

function createMessagesWithAIContributions(
  count: number,
  roles = ["Skeptic", "Optimist", "Critic"],
  options: { questionAt?: number } = {},
): Message[] {
  return [
    { id: "msg-user", authorType: "user", content: "Should we launch?" },
    ...Array.from({ length: count }, (_, index) => ({
      id: `msg-ai-${index + 1}`,
      authorType: "ai" as const,
      role: roles[index % roles.length],
      content:
        options.questionAt === index + 1
          ? "Which customer segment matters most?"
          : `AI point ${index + 1}.`,
    })),
  ];
}
