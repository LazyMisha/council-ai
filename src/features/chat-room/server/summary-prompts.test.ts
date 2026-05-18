import { buildSummaryInput, buildSummaryInstructions } from "./summary-prompts";
import type { Message } from "../domain/types";

describe("summary prompts", () => {
  it("keeps the summarizer structured but concise", () => {
    const instructions = buildSummaryInstructions();

    expect(instructions).toContain("Keep the whole summary under 180 words");
    expect(instructions).toContain("Short answer: 1-2 sentences");
    expect(instructions).toContain("Key points: max 3 bullets");
    expect(instructions).toContain("Tradeoffs: max 2 bullets");
    expect(instructions).toContain("Recommendation: 1-2 sentences");
    expect(instructions).toContain("Next steps: max 3 bullets");
    expect(instructions).toContain("Do not repeat every message");
  });

  it("passes conversation context without adding extra sections", () => {
    const messages: Message[] = [
      { id: "msg-1", authorType: "user", content: "Should we launch?" },
      {
        id: "msg-2",
        authorType: "ai",
        role: "Skeptic",
        content: "The approval path is unclear.",
      },
    ];

    const input = buildSummaryInput({ messages });

    expect(input).toContain("Skeptic: The approval path is unclear.");
    expect(input).toContain("Short answer");
    expect(input).toContain("Next steps");
    expect(input).not.toContain("Assumptions");
  });
});
