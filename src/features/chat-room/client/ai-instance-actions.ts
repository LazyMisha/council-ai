import { predefinedRoles } from "../domain/data";
import {
  addAIInstance,
  createAIInstance,
  removeAIInstance,
  updateAIInstance,
} from "../domain/state";
import type { AIInstance } from "../domain/types";
import type { ChatRoomState } from "./use-chat-room-state";

export function createAIInstanceActions(state: ChatRoomState) {
  const addInstance = (instance: AIInstance) => {
    if (!state.activeRoom) return;

    state.setChatRooms((rooms) =>
      addAIInstance(rooms, state.activeRoom!.id, instance),
    );
    state.closeRolePicker();
  };

  const addPredefinedAIInstance = (role: (typeof predefinedRoles)[number]) => {
    if (!state.activeRoom || state.activeNames.includes(role.name)) {
      return;
    }

    addInstance(
      createAIInstance({
        name: role.name,
        instructions: role.instructions,
        description: role.description,
      }),
    );
  };

  const addCustomAIInstance = () => {
    const name = state.customName.trim();
    const instructions = state.customInstructions.trim();

    if (!name) {
      state.setError("Name is required.");
      return;
    }

    if (!instructions) {
      state.setError("Instructions are required.");
      return;
    }

    if (state.activeNames.includes(name)) {
      state.setError("An AI instance with this name already exists.");
      return;
    }

    addInstance(
      createAIInstance({
        name,
        instructions,
        description: state.customDescription.trim(),
      }),
    );
  };

  const removeInstance = (instanceId: string) => {
    if (!state.activeRoom) return;

    state.setChatRooms((rooms) =>
      removeAIInstance(rooms, state.activeRoom!.id, instanceId),
    );
    state.setOpenMenuInstanceId(null);
  };

  const viewInstanceDetails = (instance: AIInstance) => {
    state.setViewingInstance(instance);
    state.setOpenMenuInstanceId(null);
  };

  const startEditInstance = (instance: AIInstance) => {
    state.setEditingInstance(instance);
    state.setEditName(instance.name);
    state.setEditInstructions(instance.instructions);
    state.setEditDescription(instance.description ?? "");
    state.setEditError(null);
    state.setOpenMenuInstanceId(null);
  };

  const saveEditInstance = () => {
    if (!state.editingInstance || !state.activeRoom) return;

    const name = state.editName.trim();
    const instructions = state.editInstructions.trim();

    if (!name) {
      state.setEditError("Name is required.");
      return;
    }

    if (!instructions) {
      state.setEditError("Instructions are required.");
      return;
    }

    const otherNames = state.activeRoom.aiInstances
      .filter((instance) => instance.id !== state.editingInstance!.id)
      .map((instance) => instance.name);

    if (otherNames.includes(name)) {
      state.setEditError("An AI instance with this name already exists.");
      return;
    }

    state.setChatRooms((rooms) =>
      updateAIInstance(rooms, state.activeRoom!.id, {
        ...state.editingInstance!,
        name,
        instructions,
        description: state.editDescription.trim() || undefined,
      }),
    );
    state.setEditingInstance(null);
    state.setEditError(null);
  };

  return {
    addCustomAIInstance,
    addPredefinedAIInstance,
    removeInstance,
    saveEditInstance,
    startEditInstance,
    viewInstanceDetails,
  };
}
