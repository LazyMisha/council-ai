import type { ChatRoom, Message, AIInstance } from "./types";
import { initialChatRooms, predefinedRoles } from "./data";

const STORAGE_KEY = "council-ai-chat-rooms";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function migrateAIInstance(instance: Record<string, unknown>): AIInstance {
  const id = instance.id;
  const role = instance.role;

  if (isNonEmptyString(id) && isNonEmptyString(role)) {
    const predefined = predefinedRoles.find((pr) => pr.name === role);

    return {
      id,
      name: role,
      instructions: predefined?.instructions ?? "",
      description: predefined?.description,
    };
  }

  return {
    id: isNonEmptyString(id) ? id : `ai-${Date.now()}`,
    name: isNonEmptyString(instance.name)
      ? instance.name
      : isNonEmptyString(role)
        ? role
        : "Unnamed",
    instructions: isNonEmptyString(instance.instructions)
      ? instance.instructions
      : "",
    description: isNonEmptyString(instance.description)
      ? instance.description
      : undefined,
  };
}

export function isValidMessage(item: unknown): item is Message {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const message = item as Record<string, unknown>;

  if (!isNonEmptyString(message.id)) return false;
  if (!isNonEmptyString(message.content)) return false;
  if (
    message.authorType !== "user" &&
    message.authorType !== "ai" &&
    message.authorType !== "system" &&
    message.authorType !== "summary"
  )
    return false;

  if (message.authorType === "ai") {
    if (!isNonEmptyString(message.role)) return false;
  }

  return true;
}

export function isValidAIInstance(item: unknown): item is AIInstance {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const instance = item as Record<string, unknown>;

  if (!isNonEmptyString(instance.id)) return false;
  if (!isNonEmptyString(instance.name)) return false;
  if (!isNonEmptyString(instance.instructions)) return false;

  return true;
}

export function isValidChatRoom(item: unknown): item is ChatRoom {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const room = item as Record<string, unknown>;

  if (!isNonEmptyString(room.id)) return false;
  if (!isNonEmptyString(room.title)) return false;
  if (!Array.isArray(room.aiInstances)) return false;
  if (!Array.isArray(room.messages)) return false;

  if (!room.aiInstances.every(isValidAIInstance)) return false;
  if (!room.messages.every(isValidMessage)) return false;
  if (typeof room.canSummarize !== "boolean") return false;

  return true;
}

export type StorageState = {
  chatRooms: ChatRoom[];
  activeRoomId: string;
};

export const defaultStorageState: StorageState = {
  chatRooms: initialChatRooms,
  activeRoomId: initialChatRooms[0]?.id ?? "",
};

function isValidStorageState(item: unknown): item is StorageState {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const state = item as Record<string, unknown>;

  if (!Array.isArray(state.chatRooms)) return false;
  if (!isNonEmptyString(state.activeRoomId)) return false;

  return true;
}

function migrateStorageState(item: Record<string, unknown>): StorageState {
  const rawRooms = Array.isArray(item.chatRooms) ? item.chatRooms : [];

  const chatRooms = rawRooms.map((room) => {
    const roomRecord = room as Record<string, unknown>;

    const rawInstances = Array.isArray(roomRecord.aiInstances)
      ? roomRecord.aiInstances
      : [];
    const rawMessages = Array.isArray(roomRecord.messages)
      ? roomRecord.messages
      : [];

    const hasSummary = rawMessages.some(
      (msg) => isValidMessage(msg) && (msg as Message).authorType === "summary",
    );

    return {
      id: isNonEmptyString(roomRecord.id) ? roomRecord.id : `room-${Date.now()}`,
      title: isNonEmptyString(roomRecord.title)
        ? roomRecord.title
        : "Untitled chat room",
      aiInstances: rawInstances.map((instance) =>
        migrateAIInstance(instance as Record<string, unknown>),
      ),
      messages: rawMessages.filter(isValidMessage),
      canSummarize:
        typeof roomRecord.canSummarize === "boolean"
          ? roomRecord.canSummarize
          : hasSummary,
    };
  });

  const activeRoomId = isNonEmptyString(item.activeRoomId)
    ? item.activeRoomId
    : chatRooms[0]?.id ?? "";

  const activeRoomExists = chatRooms.some((room) => room.id === activeRoomId);

  return {
    chatRooms,
    activeRoomId: activeRoomExists ? activeRoomId : chatRooms[0]?.id ?? "",
  };
}

export function loadStorageState(): StorageState {
  if (typeof window === "undefined") {
    return defaultStorageState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultStorageState;
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!isValidStorageState(parsed)) {
      return defaultStorageState;
    }

    const migrated = migrateStorageState(parsed as Record<string, unknown>);

    return migrated;
  } catch {
    return defaultStorageState;
  }
}

export function saveStorageState(state: StorageState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage is full or unavailable; ignore silently.
  }
}
