import { describe, expect, it } from "vitest";
import {
  addAIInstance,
  appendMessages,
  appendUserMessage,
  clearChatRoomMessages,
  createAIInstance,
  createEmptyChatRoom,
  createUserMessage,
  deleteChatRoom,
  markCanSummarizeIfMessagesUnchanged,
  removeAIInstance,
  renameChatRoom,
  updateAIInstance,
} from "./state";
import type { ChatRoom, Message } from "./types";

const room: ChatRoom = {
  id: "room-1",
  title: "Untitled chat room",
  aiInstances: [],
  messages: [],
  canSummarize: false,
};

const ai = {
  id: "ai-1",
  name: "Skeptic",
  instructions: "Focus on risks.",
};

const message: Message = {
  id: "msg-1",
  authorType: "user",
  content: "Should we launch this quarter?",
};

describe("chat-room state", () => {
  it("creates rooms, AI instances, and user messages with supplied ids", () => {
    const ids = (prefix: string) => `${prefix}-fixed`;

    expect(createEmptyChatRoom(ids).id).toBe("chat-room-fixed");
    expect(
      createAIInstance({
        idFactory: ids,
        name: "Legal Reviewer",
        instructions: "Review legal risk.",
      }).id,
    ).toBe("ai-instance-fixed");
    expect(createUserMessage("Hello", ids)).toEqual({
      id: "message-fixed",
      authorType: "user",
      content: "Hello",
    });
  });

  it("adds, updates, and removes AI instances", () => {
    const withAI = addAIInstance([room], room.id, ai);
    expect(withAI[0].aiInstances).toEqual([ai]);

    const updated = updateAIInstance(withAI, room.id, {
      ...ai,
      instructions: "Challenge weak assumptions.",
    });
    expect(updated[0].aiInstances[0].instructions).toBe(
      "Challenge weak assumptions.",
    );

    const removed = removeAIInstance(updated, room.id, ai.id);
    expect(removed[0].aiInstances).toEqual([]);
  });

  it("renames and deletes chat rooms", () => {
    const secondRoom = { ...room, id: "room-2" };
    const renamed = renameChatRoom([room, secondRoom], room.id, "Launch plan");

    expect(renamed[0].title).toBe("Launch plan");
    expect(deleteChatRoom(renamed, room.id)).toEqual({
      chatRooms: [secondRoom],
      activeRoomId: "room-2",
    });
  });

  it("derives title from the first user message only", () => {
    const withFirst = appendUserMessage([room], room.id, message);
    const withSecond = appendUserMessage(withFirst, room.id, {
      ...message,
      id: "msg-2",
      content: "Second message",
    });

    expect(withFirst[0].title).toBe("Should we launch this quarter?");
    expect(withSecond[0].title).toBe("Should we launch this quarter?");
  });

  it("appends and clears messages", () => {
    const withMessages = appendMessages([room], room.id, [message]);
    expect(withMessages[0].messages).toEqual([message]);

    const cleared = clearChatRoomMessages(
      [{ ...withMessages[0], canSummarize: true }],
      room.id,
    );
    expect(cleared[0].messages).toEqual([]);
    expect(cleared[0].canSummarize).toBe(false);
  });

  it("marks summarize only when room messages still match checked messages", () => {
    const checkedMessages = [message];
    const currentRooms = [{ ...room, messages: checkedMessages }];

    const marked = markCanSummarizeIfMessagesUnchanged({
      chatRooms: currentRooms,
      roomId: room.id,
      recentMessages: checkedMessages,
    });
    expect(marked[0].canSummarize).toBe(true);

    const stale = markCanSummarizeIfMessagesUnchanged({
      chatRooms: [{ ...room, messages: [{ ...message, id: "newer" }] }],
      roomId: room.id,
      recentMessages: checkedMessages,
    });
    expect(stale[0].canSummarize).toBe(false);
  });
});
