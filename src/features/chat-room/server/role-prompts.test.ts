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
        "one participant in a CouncilAI discussion room",
      );
      expect(instructions).toContain("not the user's assistant");
      expect(instructions).toContain("not a moderator");
      expect(instructions).toContain("not writing a report");
      expect(instructions).toContain(
        "discussing the topic with the other AI participants",
      );
      expect(instructions).toContain("Read the conversation before replying");
      expect(instructions).toContain(
        "The user message is the discussion topic for the room",
      );
      expect(instructions).toContain("Do not answer it like a personal assistant");
      expect(instructions).toContain("Max 45 words");
      expect(instructions).toContain("Prefer 1-2 short sentences");
      expect(instructions).toContain(
        "Write like a real person in a small group chat",
      );
      expect(instructions).toContain(
        "Do not sound like a helpful assistant",
      );
      expect(instructions).toContain("No generic filler");
      expect(instructions).toContain("No headings");
      expect(instructions).toContain(
        "Prefer reacting to another participant",
      );
      expect(instructions).toContain("Do not repeat what was already said");
      expect(instructions).toContain('Do not say: "As an AI"');
      expect(instructions).toContain('"Certainly"');
      expect(instructions).toContain('"Absolutely"');
      expect(instructions).toContain("Do not ask the user to clarify");
      expect(instructions).toContain(
        "Do not ask the user follow-up questions",
      );
      expect(instructions).toContain(
        "Push the discussion forward with one useful point",
      );
      expect(instructions).toContain("Do not prefix the response with the role name");
      expect(instructions).toContain('Do not write labels like "Skeptic:"');
      expect(instructions).toContain("The UI already shows the speaker name");
    }
  });

  it("avoids assistant-style user follow-up behavior", () => {
    const instructions = buildRoleInstructions({
      name: "Skeptic",
      instructions: "Focus on risks.",
    });

    expect(instructions).toContain("Do not directly address the user");
    expect(instructions).toContain("Do not end with a question to the user");
    expect(instructions).toContain(
      "If a question is useful, ask it to the room",
    );
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
    expect(instructions).toContain("Max 45 words");
  });

  it("frames reply input as a room topic, not a direct user request", () => {
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

    const input = buildRoleInput({
      latestUserMessage: "What is the smallest next step?",
      recentMessages,
    });

    expect(input).toContain("Room conversation so far, oldest to newest:");
    expect(input).toContain("Skeptic: The approval path is unclear.");
    expect(input).toContain("Topic started by the user:");
    expect(input).toContain(
      "Contribute to the room discussion as one participant",
    );
    expect(input).toContain("Do not answer the user directly");
    expect(input).not.toContain("Latest user message:");
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

    expect(instructions).toContain("Continue the existing room discussion");
    expect(instructions).toContain("Do not wait for the user");
    expect(instructions).toContain(
      "React to the latest useful point from another participant",
    );
    expect(instructions).toContain(
      "unresolved issues, disagreements, assumptions, or next steps",
    );
    expect(input).toContain("Continue the discussion");
    expect(input).toContain("React to the latest useful point");
    expect(input).not.toContain("Latest user message:");
  });
});
