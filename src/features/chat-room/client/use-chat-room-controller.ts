"use client";

import { isPredefinedName, predefinedRoles } from "../domain/data";
import { createAIInstanceActions } from "./ai-instance-actions";
import { createDiscussionActions } from "./discussion-actions";
import { createRoomActions } from "./room-actions";
import { useChatRoomState } from "./use-chat-room-state";

export function useChatRoomController() {
  const state = useChatRoomState();
  const roomActions = createRoomActions(state);
  const aiInstanceActions = createAIInstanceActions(state);
  const discussionActions = createDiscussionActions(state);

  return {
    ...state,
    ...roomActions,
    ...aiInstanceActions,
    ...discussionActions,
    isPredefinedName,
    predefinedRoles,
  };
}

export type ChatRoomController = ReturnType<typeof useChatRoomController>;
