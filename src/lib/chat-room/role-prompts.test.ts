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
      expect(instructions).toContain(
        "participant in a multi-agent chat room",
      );
      expect(instructions).toContain("Read the full conversation so far");
      expect(instructions).toContain(
        "previous AI messages in this same round",
      );
      expect(instructions).toContain("1-2 short sentences");
      expect(instructions).toContain("React to previous participants");
      expect(instructions).toContain("Avoid repeating what was already said");
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

  it("keeps generated AI responses in the next role input", () => {
    const recentMessages: Message[] = [
      {
        id: "message-1",
        authorType: "user",
        content: "Should we launch?",
      },
      {
        id: "message-2",
        authorType: "ai",
        role: "Software Architect",
        content: "Start with the existing integration.",
      },
    ];

    const input = buildRoleInput({
      latestUserMessage: "Should we launch?",
      recentMessages,
    });

    expect(input).toContain(
      "Software Architect: Start with the existing integration.",
    );
  });

  it("builds continue discussion prompts without requiring a latest user message", () => {
    const instructions = buildRoleInstructions({
      name: "Skeptic",
      instructions: "Focus on risks.",
      mode: "continue",
    });
    const input = buildRoleInput({
      mode: "continue",
      recentMessages: [
        {
          id: "message-1",
          authorType: "user",
          content: "Should we launch?",
        },
      ],
    });

    expect(instructions).toContain("Continue the existing chat-room discussion");
    expect(instructions).toContain(
      "unresolved issues, disagreements, assumptions, or next steps",
    );
    expect(input).toContain("Continue the discussion");
    expect(input).not.toContain("Latest user message:");
  });
});
