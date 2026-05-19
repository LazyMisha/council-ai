import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/features/chat-room/server/ai-orchestrator", () => ({
  streamAIResponse: vi.fn().mockImplementation(async function* () {
    yield { type: "done", message: { id: "mock", authorType: "ai" as const, role: "Mock", content: "" } };
  }),
}));

async function readStream(response: Response) {
  const text = await response.text();
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

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

  it("allows continue mode without latestUserMessage", async () => {
    const { streamAIResponse } = await import(
      "@/features/chat-room/server/ai-orchestrator"
    );
    vi.mocked(streamAIResponse).mockImplementation(async function* () {
      yield {
        type: "done",
        message: {
          id: "msg-continue",
          authorType: "ai" as const,
          role: "Skeptic",
          content: "Continue from the unresolved risk.",
        },
      };
    });

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        mode: "continue",
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
    expect(vi.mocked(streamAIResponse)).toHaveBeenLastCalledWith({
      mode: "continue",
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      ],
      recentMessages: [
        { id: "msg-0", authorType: "user", content: "Should we launch?" },
      ],
    });

    const events = await readStream(response);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("done");
    expect(events[0].message.content).toBe(
      "Continue from the unresolved risk.",
    );
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

  it("returns 400 when targetAIInstanceId does not match an AI instance", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        latestUserMessage: "Hello",
        aiInstances: [
          { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
        ],
        recentMessages: [{ id: "msg-1", authorType: "user", content: "Hi" }],
        targetAIInstanceId: "missing",
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

  it("returns 200 with a stream for a valid body", async () => {
    const { streamAIResponse } = await import(
      "@/features/chat-room/server/ai-orchestrator"
    );
    vi.mocked(streamAIResponse).mockImplementation(async function* () {
      yield { type: "chunk", content: "Risky" };
      yield {
        type: "done",
        message: {
          id: "msg-1",
          authorType: "ai" as const,
          role: "Skeptic",
          content: "Risky.",
        },
      };
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
        targetAIInstanceId: "ai-1",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/x-ndjson");

    const events = await readStream(response);
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ type: "chunk", content: "Risky" });
    expect(events[1].type).toBe("done");
    expect(events[1].message.content).toBe("Risky.");
  });
});
