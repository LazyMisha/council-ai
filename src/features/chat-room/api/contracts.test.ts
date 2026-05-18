import { describe, expect, it } from "vitest";
import {
  isFinishRequestBody,
  isRespondRequestBody,
  isSummarizeRequestBody,
} from "./contracts";

const aiInstance = {
  id: "ai-1",
  name: "Skeptic",
  instructions: "Focus on risks.",
};

const userMessage = {
  id: "msg-1",
  authorType: "user",
  content: "Should we launch?",
};

describe("chat-room API contracts", () => {
  it("validates reply respond requests with a latest user message", () => {
    expect(
      isRespondRequestBody({
        latestUserMessage: "Should we launch?",
        aiInstances: [aiInstance],
        recentMessages: [userMessage],
      }),
    ).toBe(true);
  });

  it("allows continue respond requests without latestUserMessage", () => {
    expect(
      isRespondRequestBody({
        mode: "continue",
        aiInstances: [aiInstance],
        recentMessages: [userMessage],
      }),
    ).toBe(true);
  });

  it("rejects reply respond requests missing latestUserMessage", () => {
    expect(
      isRespondRequestBody({
        aiInstances: [aiInstance],
        recentMessages: [userMessage],
      }),
    ).toBe(false);
  });

  it("rejects invalid AI instances", () => {
    expect(
      isFinishRequestBody({
        aiInstances: [{ id: "ai-1", name: "" }],
        recentMessages: [userMessage],
      }),
    ).toBe(false);
  });

  it("validates summarize requests with message history", () => {
    expect(
      isSummarizeRequestBody({
        recentMessages: [userMessage],
      }),
    ).toBe(true);
  });
});
