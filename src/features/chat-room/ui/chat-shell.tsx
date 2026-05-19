"use client";

import { useEffect, useState } from "react";
import { useChatRoomController } from "../client/use-chat-room-controller";
import { Button } from "@/components/ui";
import { ChatComposer } from "./chat-composer";
import { ChatDialogs } from "./chat-dialogs";
import { ChatHeader } from "./chat-header";
import { ChatSidebar } from "./chat-sidebar";
import { MessageList } from "./message-list";
import { useAutoScroll } from "./use-auto-scroll";

export function ChatShell() {
  const controller = useChatRoomController();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { containerRef, showScrollButton, scrollToBottom } = useAutoScroll([
    controller.activeRoom?.messages.length ?? 0,
    controller.activePendingAIStatus?.phase ?? "",
    controller.activePendingAIStatus?.roleName ?? "",
  ]);

  useEffect(() => {
    if (!isMobileDrawerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileDrawerOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileDrawerOpen]);

  const closeMobileDrawer = () => setIsMobileDrawerOpen(false);

  return (
    <main className="flex h-dvh min-h-dvh overflow-hidden bg-background text-foreground">
      <ChatSidebar controller={controller} variant="desktop" />

      {isMobileDrawerOpen ? (
        <div
          className="fixed inset-0 z-40 bg-surface md:hidden"
          onClick={closeMobileDrawer}
        >
          <div
            className="h-dvh w-screen max-w-full pt-[env(safe-area-inset-top)]"
            onClick={(event) => event.stopPropagation()}
          >
            <ChatSidebar
              controller={controller}
              onClose={closeMobileDrawer}
              onCreateRoom={() => {
                controller.createChatRoom();
                closeMobileDrawer();
              }}
              onSelectRoom={(roomId) => {
                controller.selectChatRoom(roomId);
                closeMobileDrawer();
              }}
              variant="drawer"
            />
          </div>
        </div>
      ) : null}

      <section className="min-w-0 flex flex-1 flex-col overflow-hidden">
        {controller.activeRoom ? (
          <>
            <ChatHeader
              controller={controller}
              onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
            />
            <MessageList
              activeRoom={controller.activeRoom}
              containerRef={containerRef}
              pendingAIStatus={controller.activePendingAIStatus}
              scrollToBottom={scrollToBottom}
              showScrollButton={showScrollButton}
            />
            <ChatComposer controller={controller} />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
            <p className="text-text-secondary">No chat rooms</p>
            <Button
              variant="primary"
              size="lg"
              onClick={controller.createChatRoom}
            >
              + New chat room
            </Button>
          </div>
        )}

        <ChatDialogs controller={controller} />
      </section>
    </main>
  );
}
