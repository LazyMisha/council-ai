"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  availableRoles,
} from "@/lib/chat-room/data";
import { deriveChatRoomTitle } from "@/lib/chat-room/room-title";
import {
  defaultStorageState,
  loadStorageState,
  saveStorageState,
} from "@/lib/chat-room/storage";
import type { ChatRoom, Message, RoleKey } from "@/lib/chat-room/types";

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

  const activeRoom = useMemo(
    () => chatRooms.find((room) => room.id === activeRoomId) ?? chatRooms[0],
    [activeRoomId, chatRooms],
  );

  const activeRoles = activeRoom.aiInstances.map((instance) => instance.role);
  const isThinking = thinkingRoomIds.includes(activeRoom.id);

  const createChatRoom = () => {
    const room: ChatRoom = {
      id: newId("chat-room"),
      title: "Untitled chat room",
      aiInstances: [],
      messages: [],
    };

    setChatRooms((rooms) => [room, ...rooms]);
    setActiveRoomId(room.id);
    setDraft("");
    setIsRolePickerOpen(false);
  };

  const addAIInstance = (role: RoleKey) => {
    if (activeRoles.includes(role)) {
      return;
    }

    setChatRooms((rooms) =>
      rooms.map((room) =>
        room.id === activeRoom.id
          ? {
              ...room,
              aiInstances: [
                ...room.aiInstances,
                { id: newId("ai-instance"), role },
              ],
            }
          : room,
      ),
    );
    setIsRolePickerOpen(false);
  };

  const sendMessage = async () => {
    const content = draft.trim();

    if (!content) {
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

    if (aiInstances.length > 0) {
      setThinkingRoomIds((roomIds) => [...roomIds, roomId]);
    }

    try {
      const [response] = await Promise.all([
        fetch("/api/chat-room/respond", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latestUserMessage: content,
            aiInstances,
            recentMessages,
          }),
        }),
        aiInstances.length > 0 ? wait(700) : Promise.resolve(),
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

  return (
    <main className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 overflow-hidden border-r border-border-subtle bg-surface p-4 md:flex md:flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">CouncilAI</h1>
        </div>

        <button
          type="button"
          onClick={createChatRoom}
          className="mt-5 shrink-0 h-10 rounded-md border border-accent bg-accent px-3 text-left text-sm font-medium text-white"
        >
          + New chat room
        </button>

        <nav aria-label="Chat rooms" className="mt-6 flex-1 min-h-0 space-y-1 overflow-y-auto">
          {chatRooms.map((chatRoom) => {
            const isActive = chatRoom.id === activeRoom.id;

            return (
              <button
                key={chatRoom.id}
                type="button"
                onClick={() => setActiveRoomId(chatRoom.id)}
                className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                  isActive
                    ? "bg-accent-muted text-accent"
                    : "text-text-secondary hover:bg-background hover:text-foreground"
                }`}
              >
                {chatRoom.title}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-text-primary">
              {activeRoom.title}
            </h2>
            <span className="rounded-full bg-accent-muted px-2 py-0.5 text-xs font-medium text-accent">
              {activeRoom.aiInstances.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {activeRoom.aiInstances.map((instance) => (
                <span
                  key={instance.id}
                  className="inline-flex items-center rounded-full border border-border-subtle bg-background px-2.5 py-1 text-xs font-medium text-text-secondary"
                >
                  {instance.role}
                </span>
              ))}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRolePickerOpen((open) => !open)}
                className="h-9 rounded-md border border-accent bg-accent px-3 text-sm font-medium text-white"
              >
                + Add AI
              </button>
              {isRolePickerOpen ? (
                <div className="absolute right-0 top-9 z-10 w-56 rounded-md border border-border-subtle bg-surface p-2 shadow-sm">
                  {availableRoles.map((role) => {
                    const isAdded = activeRoles.includes(role);

                    return (
                      <button
                        key={role}
                        type="button"
                        disabled={isAdded}
                        onClick={() => addAIInstance(role)}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-text-secondary hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:text-text-tertiary"
                      >
                        {role}
                        {isAdded ? " added" : ""}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-10">
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
                      className={`max-w-[82%] rounded-lg border px-4 py-3 ${
                        isUser
                          ? "border-accent bg-accent text-white"
                          : "border-border-subtle bg-surface"
                      }`}
                    >
                      {!isUser ? (
                        <p className="mb-2 text-sm font-medium text-accent">
                          {message.role}
                        </p>
                      ) : null}
                      <p
                        className={`text-sm leading-6 ${
                          isUser ? "text-white" : "text-text-secondary"
                        }`}
                      >
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
                className="h-11 rounded-md border border-accent bg-accent px-4 text-sm font-medium text-white"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function wait(duration: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}
