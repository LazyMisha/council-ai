"use client";

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
  const { containerRef, showScrollButton, scrollToBottom } = useAutoScroll([
    controller.activeRoom?.messages.length ?? 0,
    controller.activePendingAIStatus?.phase ?? "",
    controller.activePendingAIStatus?.roleName ?? "",
  ]);

  return (
    <main className="flex h-screen overflow-hidden bg-background text-foreground">
      <ChatSidebar controller={controller} />

      <section className="flex flex-1 flex-col overflow-hidden">
        {controller.activeRoom ? (
          <>
            <ChatHeader controller={controller} />
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
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
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
