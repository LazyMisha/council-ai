import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/features/chat-room/server/speaker-selector", () => ({
  selectSpeaker: vi.fn().mockResolvedValue({
    status: "selected",
    aiInstanceId: "ai-1",
    reason: "Best next speaker.",
  }),
}));

describe("POST /api/chat-room/select-speaker", () => {
  it("returns 400 for invalid JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "not-json",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON body." });
  });

  it("returns 400 for an invalid request body", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        aiInstances: "bad",
        recentMessages: [],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns a selected speaker for a valid request", async () => {
    const { selectSpeaker } = await import(
      "@/features/chat-room/server/speaker-selector"
    );
    vi.mocked(selectSpeaker).mockResolvedValue({
      status: "selected",
      aiInstanceId: "ai-2",
      reason: "Fresh perspective needed.",
    });

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        aiInstances: [
          { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
          { id: "ai-2", name: "Optimist", instructions: "Find upside." },
        ],
        recentMessages: [
          { id: "msg-1", authorType: "user", content: "Should we launch?" },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "selected",
      aiInstanceId: "ai-2",
      reason: "Fresh perspective needed.",
    });
    expect(vi.mocked(selectSpeaker)).toHaveBeenLastCalledWith({
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
        { id: "ai-2", name: "Optimist", instructions: "Find upside." },
      ],
      recentMessages: [
        { id: "msg-1", authorType: "user", content: "Should we launch?" },
      ],
    });
  });
});
