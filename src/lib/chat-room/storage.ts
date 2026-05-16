import type { ChatRoom, Message, AIInstance, RoleKey } from "./types";
import { initialChatRooms } from "./data";

const STORAGE_KEY = "council-ai-chat-rooms";

const VALID_ROLE_KEYS: RoleKey[] = [
  "Software Architect",
  "Business Analyst",
  "Skeptic",
  "Optimist",
  "Product Expert",
  "Critic",
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isValidRoleKey(role: unknown): role is RoleKey {
  return typeof role === "string" && VALID_ROLE_KEYS.includes(role as RoleKey);
}

export function isValidMessage(item: unknown): item is Message {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const message = item as Record<string, unknown>;

  if (!isNonEmptyString(message.id)) return false;
  if (!isNonEmptyString(message.content)) return false;
  if (message.authorType !== "user" && message.authorType !== "ai" && message.authorType !== "system") return false;

  if (message.authorType === "ai") {
    if (!isValidRoleKey(message.role)) return false;
  }

  return true;
}

export function isValidAIInstance(item: unknown): item is AIInstance {
  if (typeof item !== "object" || item === null) {
    return false;
  }

  const instance = item as Record<string, unknown>;

  if (!isNonEmptyString(instance.id)) return false;
  if (!isValidRoleKey(instance.role)) return false;

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
  if (!state.chatRooms.every(isValidChatRoom)) return false;
  if (!isNonEmptyString(state.activeRoomId)) return false;

  return true;
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

    const activeRoomExists = parsed.chatRooms.some(
      (room) => room.id === parsed.activeRoomId,
    );

    if (!activeRoomExists) {
      return {
        chatRooms: parsed.chatRooms,
        activeRoomId: parsed.chatRooms[0]?.id ?? "",
      };
    }

    return parsed;
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
