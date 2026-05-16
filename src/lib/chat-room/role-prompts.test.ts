import { buildRoleInput, buildRoleInstructions, getRolePrompt } from "./role-prompts";
import type { Message, RoleKey } from "./types";

const roles: RoleKey[] = [
  "Software Architect",
  "Business Analyst",
  "Skeptic",
  "Optimist",
  "Product Expert",
  "Critic",
];

describe("role prompts", () => {
  it("provides role-specific instructions for each AI instance role", () => {
    expect(getRolePrompt("Software Architect")).toContain(
      "technical feasibility",
    );
    expect(getRolePrompt("Business Analyst")).toContain("market");
    expect(getRolePrompt("Skeptic")).toContain("weak assumptions");
    expect(getRolePrompt("Optimist")).toContain("upside");
    expect(getRolePrompt("Product Expert")).toContain("MVP");
    expect(getRolePrompt("Critic")).toContain("hard questions");
  });

  it("builds concise chat instructions for every role", () => {
    for (const role of roles) {
      expect(buildRoleInstructions(role)).toContain(role);
      expect(buildRoleInstructions(role)).toContain("1-2 short sentences");
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
