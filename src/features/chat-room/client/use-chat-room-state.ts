"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultStorageState,
  loadStorageState,
  saveStorageState,
} from "../domain/storage";
import { selectActiveChatRoom } from "../domain/state";
import type { AIInstance } from "../domain/types";

export type RolePickerTab = "predefined" | "custom";
export type PendingAIStatus = {
  roomId: string;
  phase: "selecting" | "responding" | "summarizing";
  aiInstanceId?: string;
  roleName?: string;
};

export function useChatRoomState() {
  const [chatRooms, setChatRooms] = useState(defaultStorageState.chatRooms);
  const [activeRoomId, setActiveRoomId] = useState(
    defaultStorageState.activeRoomId,
  );
  const [draft, setDraft] = useState("");
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);
  const [pendingAIStatuses, setPendingAIStatuses] = useState<
    PendingAIStatus[]
  >([]);
  const [customName, setCustomName] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RolePickerTab>("predefined");

  const [openMenuInstanceId, setOpenMenuInstanceId] = useState<string | null>(
    null,
  );
  const [viewingInstance, setViewingInstance] = useState<AIInstance | null>(
    null,
  );
  const [editingInstance, setEditingInstance] = useState<AIInstance | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [isRoomMenuOpen, setIsRoomMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [autoDiscussingRoomIds, setAutoDiscussingRoomIds] = useState<string[]>(
    [],
  );
  const [stoppingAutoDiscussRoomIds, setStoppingAutoDiscussRoomIds] = useState<
    string[]
  >([]);
  const stoppingAutoDiscussRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const state = loadStorageState();

    window.setTimeout(() => {
      setChatRooms(state.chatRooms);
      setActiveRoomId(state.activeRoomId);
    }, 0);
  }, []);

  useEffect(() => {
    saveStorageState({ chatRooms, activeRoomId });
  }, [chatRooms, activeRoomId]);

  useEffect(() => {
    const handleDocumentClick = () => {
      setOpenMenuInstanceId(null);
      setIsRolePickerOpen(false);
      setIsRoomMenuOpen(false);
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  const activeRoom = useMemo(
    () => selectActiveChatRoom(chatRooms, activeRoomId),
    [activeRoomId, chatRooms],
  );
  const activePendingAIStatus = activeRoom
    ? pendingAIStatuses.find((status) => status.roomId === activeRoom.id) ??
      null
    : null;

  const activeNames = activeRoom
    ? activeRoom.aiInstances.map((instance) => instance.name)
    : [];
  const isThinking = activeRoom
    ? Boolean(activePendingAIStatus) ||
      autoDiscussingRoomIds.includes(activeRoom.id)
    : false;
  const isAutoDiscussing = activeRoom
    ? autoDiscussingRoomIds.includes(activeRoom.id)
    : false;
  const isStoppingAutoDiscuss = activeRoom
    ? stoppingAutoDiscussRoomIds.includes(activeRoom.id)
    : false;
  const hasSummary = activeRoom
    ? activeRoom.messages.some((message) => message.authorType === "summary")
    : false;
  const hasAIDiscussionRound = activeRoom
    ? activeRoom.messages.some((message) => message.authorType === "ai")
    : false;

  const resetCustomForm = () => {
    setCustomName("");
    setCustomInstructions("");
    setCustomDescription("");
    setError(null);
    setActiveTab("predefined");
  };

  const closeRolePicker = () => {
    setIsRolePickerOpen(false);
    resetCustomForm();
  };

  const closeRoomMenu = () => {
    setIsRoomMenuOpen(false);
    setIsRenaming(false);
    setRenameValue("");
    setRenameError(null);
    setConfirmingDelete(false);
    setConfirmingClear(false);
  };

  const setPendingAIStatus = (status: PendingAIStatus) => {
    setPendingAIStatuses((statuses) => [
      ...statuses.filter((item) => item.roomId !== status.roomId),
      status,
    ]);
  };

  const clearPendingAIStatus = (roomId: string) => {
    setPendingAIStatuses((statuses) =>
      statuses.filter((status) => status.roomId !== roomId),
    );
  };

  return {
    activeNames,
    activeRoom,
    activeRoomId,
    activeTab,
    activePendingAIStatus,
    autoDiscussingRoomIds,
    chatRooms,
    clearPendingAIStatus,
    closeRolePicker,
    closeRoomMenu,
    confirmingClear,
    confirmingDelete,
    customDescription,
    customInstructions,
    customName,
    draft,
    editDescription,
    editError,
    editingInstance,
    editInstructions,
    editName,
    error,
    hasAIDiscussionRound,
    hasSummary,
    isAutoDiscussing,
    isRenaming,
    isRolePickerOpen,
    isRoomMenuOpen,
    isStoppingAutoDiscuss,
    isThinking,
    openMenuInstanceId,
    renameError,
    renameValue,
    resetCustomForm,
    setActiveRoomId,
    setActiveTab,
    setAutoDiscussingRoomIds,
    setChatRooms,
    setConfirmingClear,
    setConfirmingDelete,
    setCustomDescription,
    setCustomInstructions,
    setCustomName,
    setDraft,
    setEditDescription,
    setEditError,
    setEditingInstance,
    setEditInstructions,
    setEditName,
    setError,
    setIsRenaming,
    setIsRolePickerOpen,
    setIsRoomMenuOpen,
    setOpenMenuInstanceId,
    setPendingAIStatus,
    setRenameError,
    setRenameValue,
    setStoppingAutoDiscussRoomIds,
    setViewingInstance,
    stoppingAutoDiscussRef,
    viewingInstance,
  };
}

export type ChatRoomState = ReturnType<typeof useChatRoomState>;
