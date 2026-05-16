import { describe, expect, it } from "vitest";
import {
  isValidAIInstance,
  isValidChatRoom,
  isValidMessage,
  isValidRoleKey,
} from "./storage";
import type { AIInstance, ChatRoom, Message, RoleKey } from "./types";

describe("isValidRoleKey", () => {
  it("returns true for valid roles", () => {
    const roles: RoleKey[] = [
      "Software Architect",
      "Business Analyst",
      "Skeptic",
      "Optimist",
      "Product Expert",
      "Critic",
    ];

    for (const role of roles) {
      expect(isValidRoleKey(role)).toBe(true);
    }
  });

  it("returns false for invalid roles", () => {
    expect(isValidRoleKey("Developer")).toBe(false);
    expect(isValidRoleKey("")).toBe(false);
    expect(isValidRoleKey(42)).toBe(false);
    expect(isValidRoleKey(null)).toBe(false);
    expect(isValidRoleKey(undefined)).toBe(false);
  });
});

describe("isValidMessage", () => {
  it("returns true for a valid user message", () => {
    const message: Message = {
      id: "msg-1",
      authorType: "user",
      content: "Hello",
    };

    expect(isValidMessage(message)).toBe(true);
  });

  it("returns true for a valid AI message", () => {
    const message: Message = {
      id: "msg-2",
      authorType: "ai",
      content: "Response",
      role: "Skeptic",
    };

    expect(isValidMessage(message)).toBe(true);
  });

  it("returns true for a valid system message", () => {
    const message: Message = {
      id: "msg-3",
      authorType: "system",
      content: "System notice",
    };

    expect(isValidMessage(message)).toBe(true);
  });

  it("returns false when id is missing", () => {
    expect(isValidMessage({ authorType: "user", content: "Hello" })).toBe(false);
  });

  it("returns false when content is empty", () => {
    expect(
      isValidMessage({ id: "msg-1", authorType: "user", content: "" }),
    ).toBe(false);
  });

  it("returns false when authorType is invalid", () => {
    expect(
      isValidMessage({ id: "msg-1", authorType: "bot", content: "Hello" }),
    ).toBe(false);
  });

  it("returns false when AI message lacks role", () => {
    expect(
      isValidMessage({ id: "msg-1", authorType: "ai", content: "Hello" }),
    ).toBe(false);
  });

  it("returns false when AI message has invalid role", () => {
    expect(
      isValidMessage({
        id: "msg-1",
        authorType: "ai",
        content: "Hello",
        role: "Developer",
      }),
    ).toBe(false);
  });

  it("returns false for non-objects", () => {
    expect(isValidMessage(null)).toBe(false);
    expect(isValidMessage("string")).toBe(false);
    expect(isValidMessage(42)).toBe(false);
  });
});

describe("isValidAIInstance", () => {
  it("returns true for a valid instance", () => {
    const instance: AIInstance = {
      id: "ai-1",
      role: "Optimist",
    };

    expect(isValidAIInstance(instance)).toBe(true);
  });

  it("returns false when id is missing", () => {
    expect(isValidAIInstance({ role: "Optimist" })).toBe(false);
  });

  it("returns false when role is invalid", () => {
    expect(isValidAIInstance({ id: "ai-1", role: "Developer" })).toBe(false);
  });

  it("returns false for non-objects", () => {
    expect(isValidAIInstance(null)).toBe(false);
    expect(isValidAIInstance("string")).toBe(false);
  });
});

describe("isValidChatRoom", () => {
  it("returns true for a valid room", () => {
    const room: ChatRoom = {
      id: "room-1",
      title: "Test Room",
      aiInstances: [{ id: "ai-1", role: "Skeptic" }],
      messages: [
        { id: "msg-1", authorType: "user", content: "Hello" },
      ],
    };

    expect(isValidChatRoom(room)).toBe(true);
  });

  it("returns true for an empty room", () => {
    const room: ChatRoom = {
      id: "room-1",
      title: "Test Room",
      aiInstances: [],
      messages: [],
    };

    expect(isValidChatRoom(room)).toBe(true);
  });

  it("returns false when id is missing", () => {
    expect(
      isValidChatRoom({
        title: "Test",
        aiInstances: [],
        messages: [],
      }),
    ).toBe(false);
  });

  it("returns false when title is empty", () => {
    expect(
      isValidChatRoom({
        id: "room-1",
        title: "",
        aiInstances: [],
        messages: [],
      }),
    ).toBe(false);
  });

  it("returns false when aiInstances is not an array", () => {
    expect(
      isValidChatRoom({
        id: "room-1",
        title: "Test",
        aiInstances: null,
        messages: [],
      }),
    ).toBe(false);
  });

  it("returns false when messages is not an array", () => {
    expect(
      isValidChatRoom({
        id: "room-1",
        title: "Test",
        aiInstances: [],
        messages: null,
      }),
    ).toBe(false);
  });

  it("returns false when an AI instance is invalid", () => {
    expect(
      isValidChatRoom({
        id: "room-1",
        title: "Test",
        aiInstances: [{ id: "ai-1", role: "Developer" }],
        messages: [],
      }),
    ).toBe(false);
  });

  it("returns false when a message is invalid", () => {
    expect(
      isValidChatRoom({
        id: "room-1",
        title: "Test",
        aiInstances: [],
        messages: [{ id: "msg-1", content: "Hello" }],
      }),
    ).toBe(false);
  });

  it("returns false for non-objects", () => {
    expect(isValidChatRoom(null)).toBe(false);
    expect(isValidChatRoom("string")).toBe(false);
  });
});
