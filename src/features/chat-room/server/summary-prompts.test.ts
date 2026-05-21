import { buildSummaryInput, buildSummaryInstructions } from "./summary-prompts";
import type { Message } from "../domain/types";

describe("summary prompts", () => {
  it("keeps the summarizer structured but concise", () => {
    const instructions = buildSummaryInstructions();

    expect(instructions).toContain("Keep the whole summary under 120 words");
    expect(instructions).toContain("Decision: 1 short line");
    expect(instructions).toContain("Why: 1-2 short lines");
    expect(instructions).toContain("Open risks: 1-2 short lines");
    expect(instructions).toContain("Next move: 1 short line");
    expect(instructions).toContain("If the discussion is weak, say so plainly");
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
    expect(input).toContain("Decision");
    expect(input).toContain("Next move");
    expect(input).not.toContain("Assumptions");
  });
});
