import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/chat-room/ai-orchestrator", () => ({
  generateAIResponses: vi.fn().mockResolvedValue({ messages: [] }),
}));

describe("POST /api/chat-room/respond", () => {
  it("returns 400 for invalid JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "not-json",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON body." });
  });

  it("returns 400 when latestUserMessage is missing", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ aiInstances: [], recentMessages: [] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when aiInstances is not an array", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        latestUserMessage: "Hello",
        aiInstances: "bad",
        recentMessages: [],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when an AI instance is invalid", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        latestUserMessage: "Hello",
        aiInstances: [{ id: "ai-1", name: "" }],
        recentMessages: [],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when recentMessages is not an array", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        latestUserMessage: "Hello",
        aiInstances: [],
        recentMessages: "bad",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when a message is invalid", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        latestUserMessage: "Hello",
        aiInstances: [],
        recentMessages: [{ id: "msg-1", content: "Hello" }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 200 with messages for a valid body", async () => {
    const { generateAIResponses } = await import(
      "@/lib/chat-room/ai-orchestrator"
    );
    vi.mocked(generateAIResponses).mockResolvedValue({
      messages: [
        {
          id: "msg-1",
          authorType: "ai",
          role: "Skeptic",
          content: "Risky.",
        },
      ],
    });

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        latestUserMessage: "Should we launch?",
        aiInstances: [
          { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
        ],
        recentMessages: [
          { id: "msg-0", authorType: "user", content: "Should we launch?" },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.messages).toHaveLength(1);
    expect(json.messages[0].content).toBe("Risky.");
  });
});
