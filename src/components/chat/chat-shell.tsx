"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { isPredefinedName, predefinedRoles } from "@/lib/chat-room/data";
import { getRoleAccent } from "@/lib/chat-room/role-colors";
import { deriveChatRoomTitle } from "@/lib/chat-room/room-title";
import {
  defaultStorageState,
  loadStorageState,
  saveStorageState,
} from "@/lib/chat-room/storage";
import type { AIInstance, ChatRoom, Message } from "@/lib/chat-room/types";

const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function ChatShell() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(
    defaultStorageState.chatRooms,
  );
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
  const [activeTab, setActiveTab] = useState<"predefined" | "custom">(
    "predefined",
  );

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
    () => chatRooms.find((room) => room.id === activeRoomId) ?? chatRooms[0],
    [activeRoomId, chatRooms],
  );

  const activeNames = activeRoom
    ? activeRoom.aiInstances.map((instance) => instance.name)
    : [];
  const isThinking = activeRoom
    ? thinkingRoomIds.includes(activeRoom.id)
    : false;
  const hasAIDiscussionRound = activeRoom
    ? activeRoom.messages.some((message) => message.authorType === "ai")
    : false;

  const createChatRoom = () => {
    const room: ChatRoom = {
      id: newId("chat-room"),
      title: "Untitled chat room",
      aiInstances: [],
      messages: [],
      canSummarize: false,
    };

    setChatRooms((rooms) => [room, ...rooms]);
    setActiveRoomId(room.id);
    setDraft("");
    setIsRolePickerOpen(false);
    resetCustomForm();
    closeRoomMenu();
  };

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

  const addPredefinedAIInstance = (role: (typeof predefinedRoles)[number]) => {
    if (!activeRoom || activeNames.includes(role.name)) {
      return;
    }

    const instance: AIInstance = {
      id: newId("ai-instance"),
      name: role.name,
      instructions: role.instructions,
      description: role.description,
    };

    addInstance(instance);
  };

  const addCustomAIInstance = () => {
    const name = customName.trim();
    const instructions = customInstructions.trim();

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (!instructions) {
      setError("Instructions are required.");
      return;
    }

    if (activeNames.includes(name)) {
      setError("An AI instance with this name already exists.");
      return;
    }

    const instance: AIInstance = {
      id: newId("ai-instance"),
      name,
      instructions,
      description: customDescription.trim() || undefined,
    };

    addInstance(instance);
  };

  const addInstance = (instance: AIInstance) => {
    if (!activeRoom) return;

    setChatRooms((rooms) =>
      rooms.map((room) =>
        room.id === activeRoom.id
          ? { ...room, aiInstances: [...room.aiInstances, instance] }
          : room,
      ),
    );
    closeRolePicker();
  };

  const removeAIInstance = (instanceId: string) => {
    if (!activeRoom) return;

    setChatRooms((rooms) =>
      rooms.map((room) =>
        room.id === activeRoom.id
          ? {
              ...room,
              aiInstances: room.aiInstances.filter(
                (instance) => instance.id !== instanceId,
              ),
            }
          : room,
      ),
    );
    setOpenMenuInstanceId(null);
  };

  const viewInstanceDetails = (instance: AIInstance) => {
    setViewingInstance(instance);
    setOpenMenuInstanceId(null);
  };

  const startEditInstance = (instance: AIInstance) => {
    setEditingInstance(instance);
    setEditName(instance.name);
    setEditInstructions(instance.instructions);
    setEditDescription(instance.description ?? "");
    setEditError(null);
    setOpenMenuInstanceId(null);
  };

  const saveEditInstance = () => {
    if (!editingInstance || !activeRoom) return;

    const name = editName.trim();
    const instructions = editInstructions.trim();

    if (!name) {
      setEditError("Name is required.");
      return;
    }

    if (!instructions) {
      setEditError("Instructions are required.");
      return;
    }

    const otherNames = activeRoom.aiInstances
      .filter((instance) => instance.id !== editingInstance.id)
      .map((instance) => instance.name);

    if (otherNames.includes(name)) {
      setEditError("An AI instance with this name already exists.");
      return;
    }

    setChatRooms((rooms) =>
      rooms.map((room) =>
        room.id === activeRoom.id
          ? {
              ...room,
              aiInstances: room.aiInstances.map((instance) =>
                instance.id === editingInstance.id
                  ? {
                      ...instance,
                      name,
                      instructions,
                      description: editDescription.trim() || undefined,
                    }
                  : instance,
              ),
            }
          : room,
      ),
    );
    setEditingInstance(null);
    setEditError(null);
  };

  const startRename = () => {
    if (!activeRoom) return;
    setIsRenaming(true);
    setRenameValue(activeRoom.title);
    setRenameError(null);
    setIsRoomMenuOpen(false);
  };

  const saveRename = () => {
    const title = renameValue.trim();
    if (!title) {
      setRenameError("Name cannot be empty.");
      return;
    }
    if (!activeRoom) return;

    setChatRooms((rooms) =>
      rooms.map((room) =>
        room.id === activeRoom.id ? { ...room, title } : room,
      ),
    );
    setIsRenaming(false);
    setRenameError(null);
  };

  const executeDeleteRoom = () => {
    if (!activeRoom) return;

    const deletedId = activeRoom.id;
    const remaining = chatRooms.filter((room) => room.id !== deletedId);
    const nextActive = remaining[0]?.id ?? "";

    setChatRooms(remaining);
    setActiveRoomId(nextActive);
    setConfirmingDelete(false);
    setIsRoomMenuOpen(false);
  };

  const executeClearMessages = () => {
    if (!activeRoom) return;

    setChatRooms((rooms) =>
      rooms.map((room) =>
        room.id === activeRoom.id ? { ...room, messages: [], canSummarize: false } : room,
      ),
    );
    setConfirmingClear(false);
    setIsRoomMenuOpen(false);
  };

  const sendMessage = async () => {
    const content = draft.trim();

    if (!content || !activeRoom) {
      return;
    }

    const roomId = activeRoom.id;
    const aiInstances = activeRoom.aiInstances;
    const message: Message = {
      id: newId("message"),
      authorType: "user",
      content,
    };
    const recentMessages = [...activeRoom.messages, message];

    setChatRooms((rooms) =>
      rooms.map((room) => {
        if (room.id !== roomId) {
          return room;
        }

        const isFirstUserMessage = !room.messages.some(
          (roomMessage) => roomMessage.authorType === "user",
        );

        return {
          ...room,
          title: isFirstUserMessage
            ? deriveChatRoomTitle(content)
            : room.title,
          messages: [...room.messages, message],
        };
      }),
    );
    setDraft("");

    if (aiInstances.length === 0) {
      return;
    }

    setThinkingRoomIds((roomIds) => [...roomIds, roomId]);

    try {
      const [response] = await Promise.all([
        fetch("/api/chat-room/respond", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "reply",
            latestUserMessage: content,
            aiInstances,
            recentMessages,
          }),
        }),
        wait(700),
      ]);

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { messages?: Message[] };
      const responseMessages = data.messages ?? [];

      if (responseMessages.length === 0) {
        return;
      }

      setChatRooms((rooms) =>
        rooms.map((room) =>
          room.id === roomId
            ? { ...room, messages: [...room.messages, ...responseMessages] }
            : room,
        ),
      );

      const updatedMessages = [...recentMessages, ...responseMessages];
      void fetchFinishDecision(roomId, aiInstances, updatedMessages);
    } finally {
      setThinkingRoomIds((roomIds) => {
        const roomIndex = roomIds.indexOf(roomId);
        return roomIds.filter((_, index) => index !== roomIndex);
      });
    }
  };

  const continueDiscussion = async () => {
    if (!activeRoom || activeRoom.aiInstances.length === 0 || isThinking) {
      return;
    }

    const roomId = activeRoom.id;
    const aiInstances = activeRoom.aiInstances;
    const recentMessages = activeRoom.messages;

    setThinkingRoomIds((roomIds) => [...roomIds, roomId]);

    try {
      const [response] = await Promise.all([
        fetch("/api/chat-room/respond", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "continue",
            aiInstances,
            recentMessages,
          }),
        }),
        wait(700),
      ]);

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { messages?: Message[] };
      const responseMessages = data.messages ?? [];

      if (responseMessages.length === 0) {
        return;
      }

      setChatRooms((rooms) =>
        rooms.map((room) =>
          room.id === roomId
            ? { ...room, messages: [...room.messages, ...responseMessages] }
            : room,
        ),
      );

      const updatedMessages = [...recentMessages, ...responseMessages];
      void fetchFinishDecision(roomId, aiInstances, updatedMessages);
    } finally {
      setThinkingRoomIds((roomIds) => {
        const roomIndex = roomIds.indexOf(roomId);
        return roomIds.filter((_, index) => index !== roomIndex);
      });
    }
  };

  const fetchFinishDecision = async (
    roomId: string,
    aiInstances: AIInstance[],
    recentMessages: Message[],
  ) => {
    try {
      const response = await fetch("/api/chat-room/finish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aiInstances,
          recentMessages,
        }),
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { status: string };

      if (data.status === "ready_to_summarize") {
        setChatRooms((rooms) =>
          rooms.map((room) => {
            if (room.id !== roomId) return room;

            const lastCurrent = room.messages[room.messages.length - 1];
            const lastSent = recentMessages[recentMessages.length - 1];
            const messagesUnchanged =
              room.messages.length === recentMessages.length &&
              lastCurrent?.id === lastSent?.id;

            if (!messagesUnchanged) return room;

            return { ...room, canSummarize: true };
          }),
        );
      }
    } catch {
      // Silently ignore finish detection failures.
    }
  };

  const summarizeDiscussion = async () => {
    if (!activeRoom || !hasAIDiscussionRound || isThinking) {
      return;
    }

    const roomId = activeRoom.id;
    const recentMessages = activeRoom.messages;

    setThinkingRoomIds((roomIds) => [...roomIds, roomId]);

    try {
      const [response] = await Promise.all([
        fetch("/api/chat-room/summarize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recentMessages,
          }),
        }),
        wait(700),
      ]);

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { message?: Message };
      const summaryMessage = data.message;

      if (!summaryMessage) {
        return;
      }

      setChatRooms((rooms) =>
        rooms.map((room) =>
          room.id === roomId
            ? {
                ...room,
                messages: [...room.messages, summaryMessage],
                canSummarize: true,
              }
            : room,
        ),
      );
    } finally {
      setThinkingRoomIds((roomIds) => {
        const roomIndex = roomIds.indexOf(roomId);
        return roomIds.filter((_, index) => index !== roomIndex);
      });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handlePickerClick = (event: React.MouseEvent) => {
    event.nativeEvent.stopImmediatePropagation();
  };

  return (
    <main className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 overflow-hidden border-r border-border-subtle bg-surface p-4 md:flex md:flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">CouncilAI</h1>
        </div>

        <button
          type="button"
          onClick={createChatRoom}
          className="mt-4 h-10 w-full rounded-md border border-accent bg-surface text-sm font-medium text-accent hover:bg-accent-muted cursor-pointer"
        >
          + New chat room
        </button>

        <div className="mt-4 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {chatRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  setActiveRoomId(room.id);
                  setOpenMenuInstanceId(null);
                  setIsRolePickerOpen(false);
                  setIsRoomMenuOpen(false);
                }}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                  activeRoom && room.id === activeRoom.id
                    ? "text-foreground font-medium"
                    : "text-text-secondary hover:bg-background"
                } cursor-pointer`}
              >
                <span className="line-clamp-1">{room.title}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex flex-1 flex-col overflow-hidden">
        {activeRoom ? (
          <>
            <div className="shrink-0 border-b border-border-subtle bg-surface">
              <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-2 lg:max-w-4xl">
                <div className="relative flex items-center gap-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    {activeRoom.title}
                  </h2>
                  <button
                    type="button"
                    aria-label="Chat room options"
                    onClick={(event) => {
                      event.nativeEvent.stopImmediatePropagation();
                      setOpenMenuInstanceId(null);
                      setIsRolePickerOpen(false);
                      setIsRoomMenuOpen((open) => !open);
                    }}
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:bg-surface-muted hover:text-foreground cursor-pointer"
                  >
                    &#x22EE;
                  </button>
                  {isRoomMenuOpen ? (
                    <div
                      className="absolute left-0 top-full z-10 mt-1 w-44 rounded-md border border-border-subtle bg-surface py-1 shadow-sm"
                      onClick={handlePickerClick}
                    >
                      <button
                        type="button"
                        onClick={startRename}
                        className="block w-full px-3 py-1.5 text-left text-sm text-text-secondary hover:bg-background cursor-pointer"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingClear(true);
                          setIsRoomMenuOpen(false);
                        }}
                        className="block w-full px-3 py-1.5 text-left text-sm text-text-secondary hover:bg-background cursor-pointer"
                      >
                        Clear messages
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmingDelete(true);
                          setIsRoomMenuOpen(false);
                        }}
                        className="block w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-background cursor-pointer"
                      >
                        Delete chat room
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 lg:max-w-4xl">
                <div className="flex flex-wrap gap-2">
                  {activeRoom.aiInstances.map((instance) => {
                    const accent = getRoleAccent(instance.name);

                    return (
                    <div key={instance.id} className="relative">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm"
                        style={{
                          borderColor: accent.border,
                          backgroundColor: accent.bg,
                          color: accent.text,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: accent.dot }}
                        />
                        {instance.name}
                        <button
                          type="button"
                          aria-label={`${instance.name} options`}
                          onClick={(event) => {
                            event.nativeEvent.stopImmediatePropagation();
                            setIsRolePickerOpen(false);
                            setIsRoomMenuOpen(false);
                            setOpenMenuInstanceId((current) =>
                              current === instance.id ? null : instance.id,
                            );
                          }}
                          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded text-text-tertiary hover:bg-surface-muted hover:text-foreground cursor-pointer"
                        >
                          &#x22EE;
                        </button>
                      </span>
                      {openMenuInstanceId === instance.id ? (
                        <div
                          className="absolute left-0 top-full z-10 mt-1 w-40 rounded-md border border-border-subtle bg-surface py-1 shadow-sm"
                          onClick={handlePickerClick}
                        >
                          <button
                            type="button"
                            onClick={() => viewInstanceDetails(instance)}
                            className="block w-full px-3 py-1.5 text-left text-sm text-text-secondary hover:bg-background cursor-pointer"
                          >
                            View details
                          </button>
                          {!isPredefinedName(instance.name) ? (
                            <button
                              type="button"
                              onClick={() => startEditInstance(instance)}
                              className="block w-full px-3 py-1.5 text-left text-sm text-text-secondary hover:bg-background cursor-pointer"
                            >
                              Edit
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => removeAIInstance(instance.id)}
                            className="block w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-background cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                  })}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.nativeEvent.stopImmediatePropagation();
                      setOpenMenuInstanceId(null);
                      setIsRoomMenuOpen(false);
                      setIsRolePickerOpen((open) => !open);
                    }}
                    className="h-9 rounded-md border border-accent bg-surface px-3 text-sm font-medium text-accent hover:bg-accent-muted cursor-pointer"
                  >
                    + Add AI
                  </button>
                  {isRolePickerOpen ? (
                    <div
                      className="absolute right-0 top-10 z-10 w-80 rounded-md border border-border-subtle bg-surface p-4 shadow-sm"
                      onClick={handlePickerClick}
                    >
                      <div className="mb-3 flex border-b border-border-subtle">
                        <button
                          type="button"
                          onClick={() => setActiveTab("predefined")}
                          className={`px-3 pb-2 text-sm font-medium ${
                            activeTab === "predefined"
                              ? "border-b-2 border-accent text-foreground"
                              : "text-text-secondary"
                          } cursor-pointer`}
                        >
                          Predefined
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("custom")}
                          className={`px-3 pb-2 text-sm font-medium ${
                            activeTab === "custom"
                              ? "border-b-2 border-accent text-foreground"
                              : "text-text-secondary"
                          } cursor-pointer`}
                        >
                          Custom
                        </button>
                      </div>

                      {activeTab === "predefined" ? (
                        <div className="space-y-1">
                          {predefinedRoles.map((role) => {
                            const isAdded = activeNames.includes(role.name);

                            return (
                              <button
                                key={role.name}
                                type="button"
                                disabled={isAdded}
                                onClick={() => addPredefinedAIInstance(role)}
                                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                              >
                                <div className="font-medium text-foreground">
                                  {role.name}
                                  {isAdded ? " added" : ""}
                                </div>
                                <div className="mt-0.5 text-xs text-text-tertiary">
                                  {role.description}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label
                              htmlFor="custom-name"
                              className="mb-1 block text-sm text-text-secondary"
                            >
                              Name
                            </label>
                            <input
                              id="custom-name"
                              type="text"
                              value={customName}
                              onChange={(event) => {
                                setCustomName(event.target.value);
                                setError(null);
                              }}
                              placeholder="e.g. Legal Reviewer"
                              className="h-9 w-full rounded-md border border-border-subtle bg-background px-3 text-sm outline-none placeholder:text-text-tertiary"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="custom-instructions"
                              className="mb-1 block text-sm text-text-secondary"
                            >
                              Instructions
                            </label>
                            <textarea
                              id="custom-instructions"
                              value={customInstructions}
                              onChange={(event) => {
                                setCustomInstructions(event.target.value);
                                setError(null);
                              }}
                              placeholder="What should this AI instance focus on?"
                              rows={3}
                              className="w-full resize-none rounded-md border border-border-subtle bg-background px-3 py-2 text-sm outline-none placeholder:text-text-tertiary"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="custom-description"
                              className="mb-1 block text-sm text-text-secondary"
                            >
                              Description{" "}
                              <span className="text-text-tertiary">(optional)</span>
                            </label>
                            <input
                              id="custom-description"
                              type="text"
                              value={customDescription}
                              onChange={(event) =>
                                setCustomDescription(event.target.value)
                              }
                              placeholder="Short description"
                              className="h-9 w-full rounded-md border border-border-subtle bg-background px-3 text-sm outline-none placeholder:text-text-tertiary"
                            />
                          </div>

                          {error ? (
                            <p className="text-sm text-red-500">{error}</p>
                          ) : null}

                          <button
                            type="button"
                            onClick={addCustomAIInstance}
                            className="h-9 w-full rounded-md border border-accent bg-surface text-sm font-medium text-accent hover:bg-accent-muted cursor-pointer"
                          >
                            Add AI Instance
                          </button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-10">
              <div className="mx-auto max-w-3xl lg:max-w-4xl">
                {activeRoom.messages.length === 0 ? (
                  <div className="mb-10 text-center">
                    <h2 className="text-3xl font-semibold">
                      Create a chat room to start a discussion
                    </h2>
                  </div>
                ) : null}

                <div className="space-y-5">
                  {activeRoom.messages.map((message) => {
                    const isUser = message.authorType === "user";

                    if (message.authorType === "system") {
                      return (
                        <p
                          key={message.id}
                          className="text-sm text-text-tertiary"
                        >
                          {message.content}
                        </p>
                      );
                    }

                    return (
                      <article
                        key={message.id}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className="max-w-[82%] rounded-lg border border-border-subtle bg-surface px-4 py-3"
                        >
                          {!isUser && message.role ? (
                            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                  backgroundColor: getRoleAccent(message.role).dot,
                                }}
                              />
                              <span style={{ color: getRoleAccent(message.role).text }}>
                                {message.role}
                              </span>
                            </p>
                          ) : null}
                          <p className="text-sm leading-6 text-text-secondary">
                            {message.content}
                          </p>
                        </div>
                      </article>
                    );
                  })}

                  {isThinking ? (
                    <p className="text-sm text-text-tertiary">
                      AI instances are thinking...
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-border-subtle bg-surface px-5 pb-5 pt-4">
              <div className="mx-auto max-w-3xl lg:max-w-4xl">
                {activeRoom.aiInstances.length === 0 ? (
                  <p className="mb-3 text-sm text-text-tertiary">
                    Add AI instances to start a discussion.
                  </p>
                ) : null}

                {hasAIDiscussionRound ? (
                  <div className="mb-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={continueDiscussion}
                      disabled={isThinking || activeRoom.aiInstances.length === 0}
                      className="h-8 rounded-md border border-border-subtle bg-surface px-3 text-sm text-text-secondary hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      Continue discussion
                    </button>
                    {activeRoom?.canSummarize ? (
                      <button
                        type="button"
                        onClick={summarizeDiscussion}
                        disabled={isThinking}
                        className="h-8 rounded-md border border-border-subtle bg-surface px-3 text-sm font-medium text-accent hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        Summarize
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <form
                  onSubmit={handleSubmit}
                  className="flex gap-3 rounded-lg border border-border-subtle bg-surface p-3"
                >
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    aria-label="Start a topic or reply"
                    placeholder="Start a topic or reply..."
                    className="h-11 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-text-tertiary"
                  />
                  <button
                    type="submit"
                    className="h-11 rounded-md border border-accent bg-surface px-4 text-sm font-medium text-accent hover:bg-accent-muted cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-text-secondary">No chat rooms</p>
            <button
              type="button"
              onClick={createChatRoom}
              className="h-10 rounded-md border border-accent bg-surface px-4 text-sm font-medium text-accent hover:bg-accent-muted cursor-pointer"
            >
              + New chat room
            </button>
          </div>
        )}

        {viewingInstance ? (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-32"
            onClick={() => setViewingInstance(null)}
          >
            <div
              className="w-80 rounded-md border border-border-subtle bg-surface p-4 shadow-sm"
              onClick={handlePickerClick}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-medium">{viewingInstance.name}</h3>
                <button
                  type="button"
                  onClick={() => setViewingInstance(null)}
                  className="text-sm text-text-tertiary hover:text-foreground cursor-pointer"
                >
                  Close
                </button>
              </div>
              {viewingInstance.description ? (
                <p className="mb-3 text-sm text-text-secondary">
                  {viewingInstance.description}
                </p>
              ) : null}
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-foreground">
                  Instructions:
                </span>{" "}
                {viewingInstance.instructions}
              </p>
            </div>
          </div>
        ) : null}

        {editingInstance ? (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-32"
            onClick={() => setEditingInstance(null)}
          >
            <div
              className="w-80 rounded-md border border-border-subtle bg-surface p-4 shadow-sm"
              onClick={handlePickerClick}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-medium">Edit AI Instance</h3>
                <button
                  type="button"
                  onClick={() => setEditingInstance(null)}
                  className="text-sm text-text-tertiary hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="edit-name"
                    className="mb-1 block text-sm text-text-secondary"
                  >
                    Name
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editName}
                    onChange={(event) => {
                      setEditName(event.target.value);
                      setEditError(null);
                    }}
                    className="h-9 w-full rounded-md border border-border-subtle bg-background px-3 text-sm outline-none placeholder:text-text-tertiary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-instructions"
                    className="mb-1 block text-sm text-text-secondary"
                  >
                    Instructions
                  </label>
                  <textarea
                    id="edit-instructions"
                    value={editInstructions}
                    onChange={(event) => {
                      setEditInstructions(event.target.value);
                      setEditError(null);
                    }}
                    rows={3}
                    className="w-full resize-none rounded-md border border-border-subtle bg-background px-3 py-2 text-sm outline-none placeholder:text-text-tertiary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-description"
                    className="mb-1 block text-sm text-text-secondary"
                  >
                    Description{" "}
                    <span className="text-text-tertiary">(optional)</span>
                  </label>
                  <input
                    id="edit-description"
                    type="text"
                    value={editDescription}
                    onChange={(event) =>
                      setEditDescription(event.target.value)
                    }
                    className="h-9 w-full rounded-md border border-border-subtle bg-background px-3 text-sm outline-none placeholder:text-text-tertiary"
                  />
                </div>

                {editError ? (
                  <p className="text-sm text-red-500">{editError}</p>
                ) : null}

                <button
                  type="button"
                  onClick={saveEditInstance}
                  className="h-9 w-full rounded-md border border-accent bg-surface text-sm font-medium text-accent hover:bg-accent-muted cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isRenaming ? (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-32"
            onClick={() => setIsRenaming(false)}
          >
            <div
              className="w-80 rounded-md border border-border-subtle bg-surface p-4 shadow-sm"
              onClick={handlePickerClick}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-medium">Rename chat room</h3>
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="text-sm text-text-tertiary hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(event) => {
                    setRenameValue(event.target.value);
                    setRenameError(null);
                  }}
                  className="h-9 w-full rounded-md border border-border-subtle bg-background px-3 text-sm outline-none placeholder:text-text-tertiary"
                />
                {renameError ? (
                  <p className="text-sm text-red-500">{renameError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={saveRename}
                  className="h-9 w-full rounded-md border border-accent bg-surface text-sm font-medium text-accent hover:bg-accent-muted cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {confirmingDelete ? (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-32"
            onClick={() => setConfirmingDelete(false)}
          >
            <div
              className="w-80 rounded-md border border-border-subtle bg-surface p-4 shadow-sm"
              onClick={handlePickerClick}
            >
              <div className="mb-3">
                <h3 className="text-base font-medium">Delete chat room?</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  This will remove the chat room and all its messages.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="h-9 flex-1 rounded-md border border-border-subtle bg-background text-sm font-medium text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDeleteRoom}
                  className="h-9 flex-1 rounded-md border border-red-500 bg-red-500 text-sm font-medium text-white cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {confirmingClear ? (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-32"
            onClick={() => setConfirmingClear(false)}
          >
            <div
              className="w-80 rounded-md border border-border-subtle bg-surface p-4 shadow-sm"
              onClick={handlePickerClick}
            >
              <div className="mb-3">
                <h3 className="text-base font-medium">Clear messages?</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  This will remove all messages. AI instances will stay.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  className="h-9 flex-1 rounded-md border border-border-subtle bg-background text-sm font-medium text-text-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeClearMessages}
                  className="h-9 flex-1 rounded-md border border-accent bg-accent-muted text-sm font-medium text-accent hover:bg-accent hover:text-white cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function wait(duration: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}
