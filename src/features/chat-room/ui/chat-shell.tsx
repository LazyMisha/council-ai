"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChatRoomController } from "../client/use-chat-room-controller";
import { Button } from "@/components/ui";
import { cn } from "@/components/ui/class-names";
import { ChatComposer } from "./chat-composer";
import { ChatDialogs } from "./chat-dialogs";
import { ChatHeader } from "./chat-header";
import { ChatSidebar } from "./chat-sidebar";
import { MessageList } from "./message-list";
import { useAutoScroll } from "./use-auto-scroll";

const MOBILE_DRAWER_EXIT_MS = 220;

export function ChatShell() {
  const controller = useChatRoomController();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isMobileDrawerClosing, setIsMobileDrawerClosing] = useState(false);
  const mobileDrawerCloseTimerRef = useRef<number | null>(null);
  const mobileDrawerRef = useRef<HTMLDivElement | null>(null);
  const mobileDrawerOpenerRef = useRef<HTMLElement | null>(null);
  const { containerRef, showScrollButton, scrollToBottom } = useAutoScroll([
    controller.activeRoom?.messages.length ?? 0,
    controller.activePendingAIStatus?.phase ?? "",
    controller.activePendingAIStatus?.roleName ?? "",
  ]);
  const isMobileDrawerMounted =
    isMobileDrawerOpen || isMobileDrawerClosing;

  useEffect(() => {
    return () => {
      if (mobileDrawerCloseTimerRef.current) {
        window.clearTimeout(mobileDrawerCloseTimerRef.current);
      }
    };
  }, []);

  const openMobileDrawer = (opener?: HTMLElement) => {
    mobileDrawerOpenerRef.current = opener ?? null;

    if (mobileDrawerCloseTimerRef.current) {
      window.clearTimeout(mobileDrawerCloseTimerRef.current);
      mobileDrawerCloseTimerRef.current = null;
    }

    setIsMobileDrawerClosing(false);
    setIsMobileDrawerOpen(true);
  };

  const moveFocusOutOfMobileDrawer = useCallback(() => {
    const activeElement = document.activeElement;

    if (
      !(activeElement instanceof HTMLElement) ||
      !mobileDrawerRef.current?.contains(activeElement)
    ) {
      return;
    }

    if (mobileDrawerOpenerRef.current?.isConnected) {
      mobileDrawerOpenerRef.current.focus({ preventScroll: true });
      return;
    }

    activeElement.blur();
  }, []);

  const closeMobileDrawer = useCallback(() => {
    if (!isMobileDrawerOpen) return;

    moveFocusOutOfMobileDrawer();
    setIsMobileDrawerOpen(false);
    setIsMobileDrawerClosing(true);

    if (mobileDrawerCloseTimerRef.current) {
      window.clearTimeout(mobileDrawerCloseTimerRef.current);
    }

    mobileDrawerCloseTimerRef.current = window.setTimeout(() => {
      setIsMobileDrawerClosing(false);
      mobileDrawerCloseTimerRef.current = null;
    }, MOBILE_DRAWER_EXIT_MS);
  }, [isMobileDrawerOpen, moveFocusOutOfMobileDrawer]);

  useEffect(() => {
    if (!isMobileDrawerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileDrawer();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeMobileDrawer, isMobileDrawerOpen]);

  return (
    <main className="flex h-dvh min-h-dvh overflow-hidden bg-background text-foreground">
      <ChatSidebar controller={controller} variant="desktop" />

      {isMobileDrawerMounted ? (
        <div
          ref={mobileDrawerRef}
          aria-hidden={isMobileDrawerClosing ? true : undefined}
          className={cn(
            "fixed inset-0 z-40 bg-foreground/20 md:hidden",
            isMobileDrawerClosing
              ? "chat-drawer-backdrop-exit"
              : "chat-drawer-backdrop-enter",
          )}
          onClick={closeMobileDrawer}
        >
          <div
            className={cn(
              "h-dvh w-[min(22rem,calc(100vw-2rem))] max-w-full border-r border-border-subtle bg-surface pt-[env(safe-area-inset-top)] shadow-sm",
              isMobileDrawerClosing
                ? "chat-drawer-panel-exit"
                : "chat-drawer-panel-enter",
            )}
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
              onOpenMobileDrawer={openMobileDrawer}
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
