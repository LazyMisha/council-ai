import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/chat-room/summary-orchestrator", () => ({
  generateSummary: vi.fn().mockResolvedValue({
    message: {
      id: "summary-1",
      authorType: "summary",
      role: "Summary",
      content: "Summary.",
    },
  }),
}));

describe("POST /api/chat-room/summarize", () => {
  it("returns 400 for invalid JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "not-json",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when recentMessages is invalid", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ recentMessages: "bad" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns a summary message for a valid body", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        recentMessages: [
          { id: "msg-1", authorType: "user", content: "Should we launch?" },
          {
            id: "msg-2",
            authorType: "ai",
            role: "Skeptic",
            content: "Approval is unclear.",
          },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message.authorType).toBe("summary");
    expect(json.message.role).toBe("Summary");
  });
});
