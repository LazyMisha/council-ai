import { buildRoleInput, buildRoleInstructions } from "./role-prompts";
import type { Message } from "../domain/types";

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
        "one participant in a multi-agent discussion",
      );
      expect(instructions).toContain("Read the full conversation before replying");
      expect(instructions).toContain(
        "previous AI messages in this same round",
      );
      expect(instructions).toContain("Max 55 words");
      expect(instructions).toContain("Prefer 1-3 short sentences");
      expect(instructions).toContain(
        "Sound like a natural chat participant",
      );
      expect(instructions).toContain("No essays");
      expect(instructions).toContain("No report tone");
      expect(instructions).toContain("No generic filler");
      expect(instructions).toContain("No headings or section labels");
      expect(instructions).toContain("React to the previous participant only when useful");
      expect(instructions).toContain("Avoid repeating what was already said");
      expect(instructions).toContain('Do not say "As an AI"');
      expect(instructions).toContain('"Certainly"');
      expect(instructions).toContain('"Absolutely"');
      expect(instructions).toContain("Do not repeat the full user question back to the user");
      expect(instructions).toContain("Ask at most one question");
      expect(instructions).toContain("Move the discussion forward");
      expect(instructions).toContain("Do not prefix your response with your own role name");
      expect(instructions).toContain('Do not write labels like "Skeptic:"');
      expect(instructions).toContain("The UI already shows the speaker name");
    }
  });

  it("includes the simple-topic short reply rule", () => {
    const instructions = buildRoleInstructions({
      name: "Skeptic",
      instructions: "Focus on risks.",
    });

    expect(instructions).toContain("For simple topics, use max 25 words");
    expect(instructions).toContain("Do not over-analyze");
    expect(instructions).toContain("Keep it casual and direct");
  });

  it("keeps custom AI instructions subordinate to concise chat style", () => {
    const instructions = buildRoleInstructions({
      name: "Legal Reviewer",
      instructions: "Write a detailed legal memo with many sections.",
    });

    expect(instructions).toContain("Write a detailed legal memo with many sections.");
    expect(instructions).toContain(
      "the concise chat-room style and word limits always win",
    );
    expect(instructions).toContain("Max 55 words");
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
