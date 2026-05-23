import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const detectFinish = vi.hoisted(() => vi.fn());

vi.mock("@/features/chat-room/server/finish-detector", () => ({
  detectFinish,
}));

describe("POST /api/chat-room/finish", () => {
  beforeEach(() => {
    detectFinish.mockReset();
  });

  afterEach(() => {
    detectFinish.mockReset();
  });

  const validBody = {
    aiInstances: [
      { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
    ],
    recentMessages: [
      { id: "msg-1", authorType: "user", content: "Should we launch?" },
    ],
  };

  it("returns a finish decision", async () => {
    detectFinish.mockResolvedValue({
      status: "continue_discussion",
      reason: "Not enough perspectives yet.",
    });

    const request = new Request("http://localhost/api/chat-room/finish", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    const response = await POST(request);
    const data = (await response.json()) as { status: string; reason: string };

    expect(response.status).toBe(200);
    expect(data.status).toBe("continue_discussion");
    expect(data.reason).toContain("Not enough perspectives");
  });

  it("returns ready_to_summarize when discussion is mature", async () => {
    detectFinish.mockResolvedValue({
      status: "ready_to_summarize",
      reason: "Enough arguments and tradeoffs explored.",
    });

    const request = new Request("http://localhost/api/chat-room/finish", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    const response = await POST(request);
    const data = (await response.json()) as { status: string; reason: string };

    expect(response.status).toBe(200);
    expect(data.status).toBe("ready_to_summarize");
  });

  it("returns clarification summary and questions when user input is needed", async () => {
    detectFinish.mockResolvedValue({
      status: "needs_user_input",
      reason: "Blocking questions remain",
      summary: "The AI instances need one constraint before deciding.",
      questions: ["Which launch constraint is immovable?"],
    });

    const request = new Request("http://localhost/api/chat-room/finish", {
      method: "POST",
      body: JSON.stringify(validBody),
    });

    const response = await POST(request);
    const data = (await response.json()) as {
      status: string;
      summary: string;
      questions: string[];
    };

    expect(response.status).toBe(200);
    expect(data.status).toBe("needs_user_input");
    expect(data.summary).toContain("one constraint");
    expect(data.questions).toEqual(["Which launch constraint is immovable?"]);
  });

  it("returns 400 for invalid JSON", async () => {
    const request = new Request("http://localhost/api/chat-room/finish", {
      method: "POST",
      body: "not-json",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 when recentMessages is invalid", async () => {
    const request = new Request("http://localhost/api/chat-room/finish", {
      method: "POST",
      body: JSON.stringify({ recentMessages: "bad" }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request body.");
  });

  it("returns 400 for missing aiInstances", async () => {
    const request = new Request("http://localhost/api/chat-room/finish", {
      method: "POST",
      body: JSON.stringify({ recentMessages: validBody.recentMessages }),
    });

    const response = await POST(request);
    const data = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid request body.");
  });
});
