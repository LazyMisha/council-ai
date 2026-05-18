import {
  addChatRoom,
  clearChatRoomMessages,
  createEmptyChatRoom,
  deleteChatRoom,
  renameChatRoom,
} from "../domain/state";
import type { ChatRoomState } from "./use-chat-room-state";

export function createRoomActions(state: ChatRoomState) {
  const createChatRoom = () => {
    const room = createEmptyChatRoom();

    state.setChatRooms((rooms) => addChatRoom(rooms, room));
    state.setActiveRoomId(room.id);
    state.setDraft("");
    state.setIsRolePickerOpen(false);
    state.resetCustomForm();
    state.closeRoomMenu();
  };

  const selectChatRoom = (roomId: string) => {
    state.setActiveRoomId(roomId);
    state.setOpenMenuInstanceId(null);
    state.setIsRolePickerOpen(false);
    state.setIsRoomMenuOpen(false);
  };

  const startRename = () => {
    if (!state.activeRoom) return;
    state.setIsRenaming(true);
    state.setRenameValue(state.activeRoom.title);
    state.setRenameError(null);
    state.setIsRoomMenuOpen(false);
  };

  const saveRename = () => {
    const title = state.renameValue.trim();
    if (!title) {
      state.setRenameError("Name cannot be empty.");
      return;
    }
    if (!state.activeRoom) return;

    state.setChatRooms((rooms) =>
      renameChatRoom(rooms, state.activeRoom!.id, title),
    );
    state.setIsRenaming(false);
    state.setRenameError(null);
  };

  const executeDeleteRoom = () => {
    if (!state.activeRoom) return;

    const result = deleteChatRoom(state.chatRooms, state.activeRoom.id);
    state.setChatRooms(result.chatRooms);
    state.setActiveRoomId(result.activeRoomId);
    state.setConfirmingDelete(false);
    state.setIsRoomMenuOpen(false);
  };

  const executeClearMessages = () => {
    if (!state.activeRoom) return;

    state.setChatRooms((rooms) =>
      clearChatRoomMessages(rooms, state.activeRoom!.id),
    );
    state.setConfirmingClear(false);
    state.setIsRoomMenuOpen(false);
  };

  return {
    createChatRoom,
    executeClearMessages,
    executeDeleteRoom,
    saveRename,
    selectChatRoom,
    startRename,
  };
}
