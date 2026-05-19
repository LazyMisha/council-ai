import {
  appendMessages,
  appendUserMessage,
  createId,
  createUserMessage,
  markCanSummarize,
  markCanSummarizeIfMessagesUnchanged,
  updateMessageContent,
} from "../domain/state";
import type { AIInstance, Message } from "../domain/types";
import {
  streamAIResponses,
  requestFinishDecision,
  requestSpeakerSelection,
  requestSummary,
} from "./api";
import type { ChatRoomState } from "./use-chat-room-state";

export function createDiscussionActions(state: ChatRoomState) {
  const sendMessage = async () => {
    const content = state.draft.trim();
    const activeRoom = state.activeRoom;

    if (!content || !activeRoom || activeRoom.aiInstances.length === 0) {
      return;
    }

    const roomId = activeRoom.id;
    const aiInstances = activeRoom.aiInstances;
    const message = createUserMessage(content);
    const recentMessages = [...activeRoom.messages, message];

    state.setChatRooms((rooms) => appendUserMessage(rooms, roomId, message));
    state.setDraft("");

    try {
      const selectedInstance = await selectNextAIInstance({
        roomId,
        aiInstances,
        recentMessages,
        state,
      });

      const placeholderId = createId("streaming");
      const placeholder: Message = {
        id: placeholderId,
        authorType: "ai",
        role: selectedInstance.name,
        content: "",
      };

      state.setChatRooms((rooms) =>
        appendMessages(rooms, roomId, [placeholder]),
      );

      let finalMessage: Message | null = null;

      for await (const event of streamAIResponses({
        mode: "reply",
        latestUserMessage: content,
        aiInstances,
        recentMessages,
        targetAIInstanceId: selectedInstance.id,
      })) {
        if (event.type === "chunk") {
          state.setChatRooms((rooms) =>
            updateMessageContent(rooms, roomId, placeholderId, event.content),
          );
        } else if (event.type === "done") {
          finalMessage = event.message;
        }
      }

      if (finalMessage) {
        state.setChatRooms((rooms) =>
          updateMessageContent(
            rooms,
            roomId,
            placeholderId,
            finalMessage.content,
          ),
        );
        void fetchFinishDecision(roomId, aiInstances, [
          ...recentMessages,
          finalMessage,
        ]);
      }
    } finally {
      state.clearPendingAIStatus(roomId);
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

    try {
      state.setPendingAIStatus({
        roomId,
        phase: "summarizing",
      });

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
      state.clearPendingAIStatus(roomId);
    }
  };

  const autoDiscuss = async () => {
    const activeRoom = state.activeRoom;

    if (
      !activeRoom ||
      activeRoom.aiInstances.length < 2 ||
      state.autoDiscussingRoomIds.includes(activeRoom.id)
    ) {
      return;
    }

    const roomId = activeRoom.id;
    const maxTurns = 20;

    state.setAutoDiscussingRoomIds((ids) => [...ids, roomId]);

    let currentMessages = [...activeRoom.messages];
    const aiInstances = activeRoom.aiInstances;

    try {
      for (let turn = 0; turn < maxTurns; turn++) {
        if (state.stoppingAutoDiscussRef.current.has(roomId)) {
          break;
        }

        const selectedInstance = await selectNextAIInstance({
          roomId,
          aiInstances,
          recentMessages: currentMessages,
          state,
        });

        if (state.stoppingAutoDiscussRef.current.has(roomId)) {
          break;
        }

        const placeholderId = createId("streaming");
        const placeholder: Message = {
          id: placeholderId,
          authorType: "ai",
          role: selectedInstance.name,
          content: "",
        };

        state.setChatRooms((rooms) =>
          appendMessages(rooms, roomId, [placeholder]),
      );

        let finalMessage: Message | null = null;

        for await (const event of streamAIResponses({
          mode: "continue",
          aiInstances,
          recentMessages: currentMessages,
          targetAIInstanceId: selectedInstance.id,
        })) {
          if (event.type === "chunk") {
            state.setChatRooms((rooms) =>
              updateMessageContent(
                rooms,
                roomId,
                placeholderId,
                event.content,
              ),
            );
          } else if (event.type === "done") {
            finalMessage = event.message;
          }
        }

        await wait(300);

        if (!finalMessage) {
          break;
        }

        currentMessages = [...currentMessages, finalMessage];
        state.setChatRooms((rooms) =>
          updateMessageContent(
            rooms,
            roomId,
            placeholderId,
            finalMessage.content,
          ),
        );

        if (state.stoppingAutoDiscussRef.current.has(roomId)) {
          state.clearPendingAIStatus(roomId);
        } else {
          state.setPendingAIStatus({
            roomId,
            phase: "selecting",
          });
        }

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
      state.clearPendingAIStatus(roomId);
      state.setStoppingAutoDiscussRoomIds((ids) =>
        ids.filter((id) => id !== roomId),
      );
      state.stoppingAutoDiscussRef.current.delete(roomId);
    }
  };

  const stopAutoDiscuss = () => {
    if (!state.activeRoom) return;
    const roomId = state.activeRoom.id;

    state.stoppingAutoDiscussRef.current.add(roomId);
    state.setStoppingAutoDiscussRoomIds((ids) =>
      ids.includes(roomId) ? ids : [...ids, roomId],
    );
  };

  return {
    autoDiscuss,
    sendMessage,
    stopAutoDiscuss,
    summarizeDiscussion,
  };
}

async function selectNextAIInstance({
  roomId,
  aiInstances,
  recentMessages,
  state,
}: {
  roomId: string;
  aiInstances: AIInstance[];
  recentMessages: Message[];
  state: ChatRoomState;
}) {
  if (aiInstances.length === 1) {
    const [selectedInstance] = aiInstances;

    state.setPendingAIStatus({
      roomId,
      phase: "responding",
      aiInstanceId: selectedInstance.id,
      roleName: selectedInstance.name,
    });

    return selectedInstance;
  }

  state.setPendingAIStatus({
    roomId,
    phase: "selecting",
  });

  const selection = await requestSpeakerSelection({
    aiInstances,
    recentMessages,
  });
  const selectedInstance =
    aiInstances.find((instance) => instance.id === selection?.aiInstanceId) ??
    aiInstances[0];

  state.setPendingAIStatus({
    roomId,
    phase: "responding",
    aiInstanceId: selectedInstance.id,
    roleName: selectedInstance.name,
  });

  return selectedInstance;
}

function wait(duration: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}
