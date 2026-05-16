import { describe, expect, it } from "vitest";
import {
  defaultStorageState,
  isValidAIInstance,
  isValidChatRoom,
  isValidMessage,
  loadStorageState,
  saveStorageState,
} from "./storage";
import type { AIInstance, ChatRoom, Message } from "./types";

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

  it("returns true when AI message has a custom role", () => {
    expect(
      isValidMessage({
        id: "msg-1",
        authorType: "ai",
        content: "Hello",
        role: "Legal Reviewer",
      }),
    ).toBe(true);
  });

  it("returns false for non-objects", () => {
    expect(isValidMessage(null)).toBe(false);
    expect(isValidMessage("string")).toBe(false);
    expect(isValidMessage(42)).toBe(false);
  });
});

describe("isValidAIInstance", () => {
  it("returns true for a valid predefined instance", () => {
    const instance: AIInstance = {
      id: "ai-1",
      name: "Optimist",
      instructions: "Focus on upside.",
    };

    expect(isValidAIInstance(instance)).toBe(true);
  });

  it("returns true for a valid custom instance", () => {
    const instance: AIInstance = {
      id: "ai-2",
      name: "Legal Reviewer",
      instructions: "Review from a legal perspective.",
      description: "Optional description",
    };

    expect(isValidAIInstance(instance)).toBe(true);
  });

  it("returns false when id is missing", () => {
    expect(isValidAIInstance({ name: "Optimist", instructions: "Focus." })).toBe(
      false,
    );
  });

  it("returns false when name is missing", () => {
    expect(
      isValidAIInstance({ id: "ai-1", instructions: "Focus." }),
    ).toBe(false);
  });

  it("returns false when instructions are missing", () => {
    expect(isValidAIInstance({ id: "ai-1", name: "Optimist" })).toBe(false);
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
      aiInstances: [
        { id: "ai-1", name: "Skeptic", instructions: "Focus on risks." },
      ],
      messages: [{ id: "msg-1", authorType: "user", content: "Hello" }],
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
        aiInstances: [{ id: "ai-1", name: "" }],
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

describe("loadStorageState", () => {
  const storageKey = "council-ai-chat-rooms";

  it("returns default state when localStorage is empty", () => {
    window.localStorage.removeItem(storageKey);
    const state = loadStorageState();
    expect(state.chatRooms).toEqual(defaultStorageState.chatRooms);
    expect(state.activeRoomId).toBe(defaultStorageState.activeRoomId);
  });

  it("returns default state when localStorage contains invalid JSON", () => {
    window.localStorage.setItem(storageKey, "not-json");
    const state = loadStorageState();
    expect(state.chatRooms).toEqual(defaultStorageState.chatRooms);
  });

  it("returns default state when the stored shape is invalid", () => {
    window.localStorage.setItem(storageKey, JSON.stringify({ foo: "bar" }));
    const state = loadStorageState();
    expect(state.chatRooms).toEqual(defaultStorageState.chatRooms);
  });

  it("migrates old AI instances that used 'role' instead of 'name'", () => {
    const oldState = {
      chatRooms: [
        {
          id: "room-1",
          title: "Old Room",
          aiInstances: [
            { id: "ai-1", role: "Skeptic", instructions: "Focus on risks." },
          ],
          messages: [{ id: "msg-1", authorType: "user", content: "Hello" }],
        },
      ],
      activeRoomId: "room-1",
    };

    window.localStorage.setItem(storageKey, JSON.stringify(oldState));
    const state = loadStorageState();

    expect(state.chatRooms[0].aiInstances[0].name).toBe("Skeptic");
    expect(state.chatRooms[0].aiInstances[0].instructions).toContain(
      "risks",
    );
  });

  it("falls back to the first room id when the active room does not exist", () => {
    const statePayload = {
      chatRooms: [
        {
          id: "room-1",
          title: "Room One",
          aiInstances: [],
          messages: [],
        },
      ],
      activeRoomId: "missing-room",
    };

    window.localStorage.setItem(storageKey, JSON.stringify(statePayload));
    const state = loadStorageState();
    expect(state.activeRoomId).toBe("room-1");
  });
});

describe("saveStorageState", () => {
  const storageKey = "council-ai-chat-rooms";

  it("writes state to localStorage", () => {
    const state = {
      chatRooms: [
        {
          id: "room-1",
          title: "Test",
          aiInstances: [],
          messages: [],
        },
      ],
      activeRoomId: "room-1",
    };

    saveStorageState(state);
    const raw = window.localStorage.getItem(storageKey);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual(state);
  });
});

describe("loadStorageState migration edge cases", () => {
  const storageKey = "council-ai-chat-rooms";

  it("migrates an old instance with an unknown role to a custom instance", () => {
    const oldState = {
      chatRooms: [
        {
          id: "room-1",
          title: "Old Room",
          aiInstances: [
            { id: "ai-1", role: "Unknown Role", instructions: "Do stuff." },
          ],
          messages: [],
        },
      ],
      activeRoomId: "room-1",
    };

    window.localStorage.setItem(storageKey, JSON.stringify(oldState));
    const state = loadStorageState();

    expect(state.chatRooms[0].aiInstances[0].name).toBe("Unknown Role");
    expect(state.chatRooms[0].aiInstances[0].instructions).toBe("");
  });

  it("round-trips a custom AI instance through save and load", () => {
    const state = {
      chatRooms: [
        {
          id: "room-1",
          title: "Test Room",
          aiInstances: [
            {
              id: "ai-1",
              name: "Legal Reviewer",
              instructions: "Review legal aspects.",
              description: "Optional description",
            },
          ],
          messages: [],
        },
      ],
      activeRoomId: "room-1",
    };

    saveStorageState(state);
    const loaded = loadStorageState();

    expect(loaded.chatRooms[0].aiInstances[0]).toEqual(
      state.chatRooms[0].aiInstances[0],
    );
  });
});
