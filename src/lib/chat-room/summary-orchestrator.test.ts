import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateSummary } from "./summary-orchestrator";
import type { Message } from "./types";

const recentMessages: Message[] = [
  {
    id: "msg-user",
    authorType: "user",
    content: "Should we launch?",
  },
  {
    id: "msg-architect",
    authorType: "ai",
    role: "Software Architect",
    content: "Start with one integration.",
  },
  {
    id: "msg-skeptic",
    authorType: "ai",
    role: "Skeptic",
    content: "The approval path is unclear.",
  },
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

describe("generateSummary", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    openAIResponsesCreate.mockReset();
  });

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalKey;
  });

  it("creates a summary message with a clear author type", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: "Key points: Launch narrowly.\nNext steps: Pick owner.",
    });

    const result = await generateSummary({ recentMessages });

    expect(result.message.authorType).toBe("summary");
    expect(result.message.role).toBe("Moderator Summary");
    expect(result.message.content).toContain("Key points");
  });

  it("passes the full conversation to the summarizer prompt", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    openAIResponsesCreate.mockResolvedValue({
      output_text: "Summary.",
    });

    await generateSummary({ recentMessages });

    const call = openAIResponsesCreate.mock.calls[0][0];

    expect(call.instructions).toContain("neutral internal moderator");
    expect(call.input).toContain("Software Architect: Start with one integration.");
    expect(call.input).toContain("Skeptic: The approval path is unclear.");
    expect(call.input).toContain("Recommendation");
    expect(call.input).toContain("Next steps");
  });

  it("uses a mock summary fallback when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await generateSummary({ recentMessages });

    expect(result.message.authorType).toBe("summary");
    expect(result.message.content).toContain("Key points");
    expect(result.message.content).toContain("Disagreements / tradeoffs");
    expect(result.message.content).toContain("Recommendation");
    expect(openAIResponsesCreate).not.toHaveBeenCalled();
  });
});
