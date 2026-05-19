import { deriveChatRoomTitle } from "./room-title";
import type { AIInstance, ChatRoom, Message } from "./types";

export type IdFactory = (prefix: string) => string;

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyChatRoom(idFactory: IdFactory = createId): ChatRoom {
  return {
    id: idFactory("chat-room"),
    title: "Untitled chat room",
    aiInstances: [],
    messages: [],
    canSummarize: false,
  };
}

export function createAIInstance({
  description,
  idFactory = createId,
  instructions,
  name,
}: {
  description?: string;
  idFactory?: IdFactory;
  instructions: string;
  name: string;
}): AIInstance {
  return {
    id: idFactory("ai-instance"),
    name,
    instructions,
    description: description || undefined,
  };
}

export function createUserMessage(
  content: string,
  idFactory: IdFactory = createId,
): Message {
  return {
    id: idFactory("message"),
    authorType: "user",
    content,
  };
}

export function selectActiveChatRoom(
  chatRooms: ChatRoom[],
  activeRoomId: string,
) {
  return chatRooms.find((room) => room.id === activeRoomId) ?? chatRooms[0];
}

export function addChatRoom(chatRooms: ChatRoom[], room: ChatRoom) {
  return [room, ...chatRooms];
}

export function addAIInstance(
  chatRooms: ChatRoom[],
  roomId: string,
  instance: AIInstance,
) {
  return updateChatRoom(chatRooms, roomId, (room) => ({
    ...room,
    aiInstances: [...room.aiInstances, instance],
  }));
}

export function removeAIInstance(
  chatRooms: ChatRoom[],
  roomId: string,
  instanceId: string,
) {
  return updateChatRoom(chatRooms, roomId, (room) => ({
    ...room,
    aiInstances: room.aiInstances.filter((instance) => instance.id !== instanceId),
  }));
}

export function updateAIInstance(
  chatRooms: ChatRoom[],
  roomId: string,
  updatedInstance: AIInstance,
) {
  return updateChatRoom(chatRooms, roomId, (room) => ({
    ...room,
    aiInstances: room.aiInstances.map((instance) =>
      instance.id === updatedInstance.id ? updatedInstance : instance,
    ),
  }));
}

export function renameChatRoom(
  chatRooms: ChatRoom[],
  roomId: string,
  title: string,
) {
  return updateChatRoom(chatRooms, roomId, (room) => ({ ...room, title }));
}

export function deleteChatRoom(chatRooms: ChatRoom[], roomId: string) {
  const remainingRooms = chatRooms.filter((room) => room.id !== roomId);

  return {
    chatRooms: remainingRooms,
    activeRoomId: remainingRooms[0]?.id ?? "",
  };
}

export function clearChatRoomMessages(chatRooms: ChatRoom[], roomId: string) {
  return updateChatRoom(chatRooms, roomId, (room) => ({
    ...room,
    messages: [],
    canSummarize: false,
  }));
}

export function appendMessages(
  chatRooms: ChatRoom[],
  roomId: string,
  messages: Message[],
) {
  return updateChatRoom(chatRooms, roomId, (room) => ({
    ...room,
    messages: [...room.messages, ...messages],
  }));
}

export function appendUserMessage(
  chatRooms: ChatRoom[],
  roomId: string,
  message: Message,
) {
  return updateChatRoom(chatRooms, roomId, (room) => {
    const isFirstUserMessage = !room.messages.some(
      (roomMessage) => roomMessage.authorType === "user",
    );

    return {
      ...room,
      title: isFirstUserMessage
        ? deriveChatRoomTitle(message.content)
        : room.title,
      messages: [...room.messages, message],
    };
  });
}

export function markCanSummarize(chatRooms: ChatRoom[], roomId: string) {
  return updateChatRoom(chatRooms, roomId, (room) => ({
    ...room,
    canSummarize: true,
  }));
}

export function markCanSummarizeIfMessagesUnchanged({
  chatRooms,
  recentMessages,
  roomId,
}: {
  chatRooms: ChatRoom[];
  recentMessages: Message[];
  roomId: string;
}) {
  return updateChatRoom(chatRooms, roomId, (room) => {
    const lastCurrent = room.messages[room.messages.length - 1];
    const lastSent = recentMessages[recentMessages.length - 1];
    const messagesUnchanged =
      room.messages.length === recentMessages.length &&
      lastCurrent?.id === lastSent?.id;

    return messagesUnchanged ? { ...room, canSummarize: true } : room;
  });
}

export function updateMessageContent(
  chatRooms: ChatRoom[],
  roomId: string,
  messageId: string,
  content: string,
) {
  return updateChatRoom(chatRooms, roomId, (room) => ({
    ...room,
    messages: room.messages.map((message) =>
      message.id === messageId ? { ...message, content } : message,
    ),
  }));
}

function updateChatRoom(
  chatRooms: ChatRoom[],
  roomId: string,
  update: (room: ChatRoom) => ChatRoom,
) {
  return chatRooms.map((room) => (room.id === roomId ? update(room) : room));
}
