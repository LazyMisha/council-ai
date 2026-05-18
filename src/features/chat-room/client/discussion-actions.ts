import {
  appendMessages,
  appendUserMessage,
  createUserMessage,
  markCanSummarize,
  markCanSummarizeIfMessagesUnchanged,
} from "../domain/state";
import type { AIInstance, Message } from "../domain/types";
import {
  requestAIResponses,
  requestFinishDecision,
  requestSummary,
} from "./api";
import type { ChatRoomState } from "./use-chat-room-state";

export function createDiscussionActions(state: ChatRoomState) {
  const sendMessage = async () => {
    const content = state.draft.trim();

    if (!content || !state.activeRoom) {
      return;
    }

    const roomId = state.activeRoom.id;
    const aiInstances = state.activeRoom.aiInstances;
    const message = createUserMessage(content);
    const recentMessages = [...state.activeRoom.messages, message];

    state.setChatRooms((rooms) => appendUserMessage(rooms, roomId, message));
    state.setDraft("");

    if (aiInstances.length === 0) {
      return;
    }

    state.addThinkingRoom(roomId);

    try {
      const [responseMessages] = await Promise.all([
        requestAIResponses({
          mode: "reply",
          latestUserMessage: content,
          aiInstances,
          recentMessages,
        }),
        wait(700),
      ]);

      if (responseMessages.length === 0) {
        return;
      }

      state.setChatRooms((rooms) =>
        appendMessages(rooms, roomId, responseMessages),
      );
      void fetchFinishDecision(roomId, aiInstances, [
        ...recentMessages,
        ...responseMessages,
      ]);
    } finally {
      state.removeThinkingRoom(roomId);
    }
  };

  const continueDiscussion = async () => {
    if (
      !state.activeRoom ||
      state.activeRoom.aiInstances.length === 0 ||
      state.isThinking
    ) {
      return;
    }

    const roomId = state.activeRoom.id;
    const aiInstances = state.activeRoom.aiInstances;
    const recentMessages = state.activeRoom.messages;

    state.addThinkingRoom(roomId);

    try {
      const [responseMessages] = await Promise.all([
        requestAIResponses({
          mode: "continue",
          aiInstances,
          recentMessages,
        }),
        wait(700),
      ]);

      if (responseMessages.length === 0) {
        return;
      }

      state.setChatRooms((rooms) =>
        appendMessages(rooms, roomId, responseMessages),
      );
      void fetchFinishDecision(roomId, aiInstances, [
        ...recentMessages,
        ...responseMessages,
      ]);
    } finally {
      state.removeThinkingRoom(roomId);
    }
  };

  const fetchFinishDecision = async (
    roomId: string,
    aiInstances: AIInstance[],
    recentMessages: Message[],
  ) => {
    try {
      const decision = await requestFinishDecision({
        aiInstances,
        recentMessages,
      });

      if (decision?.status === "ready_to_summarize") {
        state.setChatRooms((rooms) =>
          markCanSummarizeIfMessagesUnchanged({
            chatRooms: rooms,
            roomId,
            recentMessages,
          }),
        );
      }
    } catch {
      // Silently ignore finish detection failures.
    }
  };

  const summarizeDiscussion = async () => {
    if (!state.activeRoom || !state.hasAIDiscussionRound || state.isThinking) {
      return;
    }

    const roomId = state.activeRoom.id;
    const recentMessages = state.activeRoom.messages;

    state.addThinkingRoom(roomId);

    try {
      const [summaryMessage] = await Promise.all([
        requestSummary(recentMessages),
        wait(700),
      ]);

      if (!summaryMessage) {
        return;
      }

      state.setChatRooms((rooms) =>
        markCanSummarize(
          appendMessages(rooms, roomId, [summaryMessage]),
          roomId,
        ),
      );
    } finally {
      state.removeThinkingRoom(roomId);
    }
  };

  const autoDiscuss = async () => {
    if (
      !state.activeRoom ||
      state.activeRoom.aiInstances.length === 0 ||
      state.autoDiscussingRoomIds.includes(state.activeRoom.id)
    ) {
      return;
    }

    const roomId = state.activeRoom.id;
    const maxTurns = 20;

    state.setAutoDiscussingRoomIds((ids) => [...ids, roomId]);

    let currentMessages = [...state.activeRoom.messages];
    const aiInstances = state.activeRoom.aiInstances;

    try {
      for (let turn = 0; turn < maxTurns; turn++) {
        if (state.stoppingAutoDiscussRef.current.has(roomId)) {
          break;
        }

        const [responseMessages] = await Promise.all([
          requestAIResponses({
            mode: "continue",
            aiInstances,
            recentMessages: currentMessages,
          }),
          wait(700),
        ]);

        if (responseMessages.length === 0) {
          break;
        }

        currentMessages = [...currentMessages, ...responseMessages];
        state.setChatRooms((rooms) =>
          appendMessages(rooms, roomId, responseMessages),
        );

        const finishDecision = await requestFinishDecision({
          aiInstances,
          recentMessages: currentMessages,
        });

        if (finishDecision?.status === "ready_to_summarize") {
          state.setChatRooms((rooms) => markCanSummarize(rooms, roomId));
        }
      }
    } finally {
      state.setAutoDiscussingRoomIds((ids) =>
        ids.filter((id) => id !== roomId),
      );
      state.stoppingAutoDiscussRef.current.delete(roomId);
    }
  };

  const stopAutoDiscuss = () => {
    if (!state.activeRoom) return;
    state.stoppingAutoDiscussRef.current.add(state.activeRoom.id);
  };

  return {
    autoDiscuss,
    continueDiscussion,
    sendMessage,
    stopAutoDiscuss,
    summarizeDiscussion,
  };
}

function wait(duration: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}
