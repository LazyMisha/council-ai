import { buildRoleInput, buildRoleInstructions } from "./role-prompts";
import type { Message } from "./types";

const roleNames = [
  "Software Architect",
  "Business Analyst",
  "Skeptic",
  "Optimist",
  "Product Expert",
  "Critic",
  "Custom Reviewer",
];

describe("role prompts", () => {
  it("builds concise chat instructions for every role", () => {
    for (const name of roleNames) {
      const instructions = buildRoleInstructions({
        name,
        instructions: `Focus on ${name} things.`,
      });
      expect(instructions).toContain(name);
      expect(instructions).toContain("1-2 short sentences");
    }
  });

  it("builds role input from recent context and the latest user message", () => {
    const recentMessages: Message[] = [
      {
        id: "message-1",
        authorType: "user",
        content: "Should we launch?",
      },
      {
        id: "message-2",
        authorType: "ai",
        role: "Skeptic",
        content: "The approval path is unclear.",
      },
    ];

    expect(
      buildRoleInput({
        latestUserMessage: "What is the smallest next step?",
        recentMessages,
      }),
    ).toContain("Skeptic: The approval path is unclear.");
  });
});
