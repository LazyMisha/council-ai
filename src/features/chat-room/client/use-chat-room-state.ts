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

export function useChatRoomState() {
  const [chatRooms, setChatRooms] = useState(defaultStorageState.chatRooms);
  const [activeRoomId, setActiveRoomId] = useState(
    defaultStorageState.activeRoomId,
  );
  const [draft, setDraft] = useState("");
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);
  const [thinkingRoomIds, setThinkingRoomIds] = useState<string[]>([]);
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

  const activeNames = activeRoom
    ? activeRoom.aiInstances.map((instance) => instance.name)
    : [];
  const isThinking = activeRoom
    ? thinkingRoomIds.includes(activeRoom.id) ||
      autoDiscussingRoomIds.includes(activeRoom.id)
    : false;
  const isAutoDiscussing = activeRoom
    ? autoDiscussingRoomIds.includes(activeRoom.id)
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

  const addThinkingRoom = (roomId: string) => {
    setThinkingRoomIds((roomIds) => [...roomIds, roomId]);
  };

  const removeThinkingRoom = (roomId: string) => {
    setThinkingRoomIds((roomIds) => {
      const roomIndex = roomIds.indexOf(roomId);
      return roomIds.filter((_, index) => index !== roomIndex);
    });
  };

  return {
    activeNames,
    activeRoom,
    activeRoomId,
    activeTab,
    addThinkingRoom,
    autoDiscussingRoomIds,
    chatRooms,
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
    isThinking,
    openMenuInstanceId,
    removeThinkingRoom,
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
    setRenameError,
    setRenameValue,
    setViewingInstance,
    stoppingAutoDiscussRef,
    viewingInstance,
  };
}

export type ChatRoomState = ReturnType<typeof useChatRoomState>;
