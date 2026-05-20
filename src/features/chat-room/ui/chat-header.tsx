"use client";

import { useEffect, useState } from "react";
import type { AIInstance } from "../domain/types";
import type { ChatRoomController } from "../client/use-chat-room-controller";
import { IconButton, MenuItem } from "@/components/ui";
import { stopMenuClick } from "./events";
import { RoleChip } from "./role-chip";
import { RolePicker } from "./role-picker";

type ChatHeaderProps = {
  controller: ChatRoomController;
  onOpenMobileDrawer: (opener: HTMLElement) => void;
};

export function ChatHeader({ controller, onOpenMobileDrawer }: ChatHeaderProps) {
  const [isMobileAIListOpen, setIsMobileAIListOpen] = useState(false);
  const activeRoom = controller.activeRoom;

  useEffect(() => {
    const handleDocumentClick = () => setIsMobileAIListOpen(false);

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  if (!activeRoom) return null;

  const aiInstanceCount = activeRoom.aiInstances.length;
  const aiInstanceLabel =
    aiInstanceCount === 1 ? "1 AI instance" : `${aiInstanceCount} AI instances`;
  const closeMobileAIList = () => {
    setIsMobileAIListOpen(false);
    controller.setOpenMenuInstanceId(null);
  };
  const handleViewInstance = (instance: AIInstance) => {
    controller.viewInstanceDetails(instance);
    closeMobileAIList();
  };
  const handleEditInstance = (instance: AIInstance) => {
    controller.startEditInstance(instance);
    closeMobileAIList();
  };
  const handleRemoveInstance = (instanceId: string) => {
    controller.removeInstance(instanceId);
    closeMobileAIList();
  };

  return (
    <div className="shrink-0 border-b border-border-subtle bg-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2 sm:px-5 lg:max-w-4xl">
        <div className="relative flex min-w-0 flex-1 items-center gap-1">
          <IconButton
            aria-label="Open chat room navigation"
            className="mr-1 h-12 w-12 rounded-md text-lg md:hidden"
            onClick={(event) => onOpenMobileDrawer(event.currentTarget)}
          >
            &#x2630;
          </IconButton>
          <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground sm:text-lg">
            {activeRoom.title}
          </h2>
        </div>
      </div>
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-3 sm:px-5 lg:max-w-4xl">
        <div className="-mx-1 hidden min-w-0 flex-1 gap-2 overflow-x-auto px-1 pb-1 sm:flex sm:flex-wrap sm:overflow-visible sm:pb-0">
          {activeRoom.aiInstances.map((instance) => (
            <RoleChip
              key={instance.id}
              controller={controller}
              instance={instance}
            />
          ))}
        </div>
        <div className="relative min-w-0 flex-1 sm:hidden">
          <button
            type="button"
            aria-expanded={isMobileAIListOpen}
            aria-label="Show added AI instances"
            onClick={(event) => {
              stopMenuClick(event);
              controller.setOpenMenuInstanceId(null);
              controller.setIsRolePickerOpen(false);
              setIsMobileAIListOpen((open) => !open);
            }}
            className="h-11 w-full min-w-0 truncate rounded-md border border-border-subtle bg-background px-3 text-left text-sm font-medium text-text-secondary hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
          >
            {aiInstanceLabel}
          </button>
          {isMobileAIListOpen ? (
            <div
              aria-label="Added AI instances"
              className="fixed inset-x-3 top-28 z-50 max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain rounded-md border border-border-subtle bg-surface p-1 shadow-sm"
              role="region"
              onClick={stopMenuClick}
            >
              {activeRoom.aiInstances.length > 0 ? (
                <div className="space-y-0.5">
                  {activeRoom.aiInstances.map((instance) => (
                    <div
                      key={instance.id}
                      className="relative rounded-md hover:bg-background"
                    >
                      <div className="flex min-h-11 items-center gap-2 px-2.5 py-1">
                        <button
                          type="button"
                          onClick={() => handleViewInstance(instance)}
                          className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
                        >
                          {instance.name}
                        </button>
                        <IconButton
                          aria-label={`${instance.name} options`}
                          onClick={(event) => {
                            stopMenuClick(event);
                            controller.setOpenMenuInstanceId((current) =>
                              current === instance.id ? null : instance.id,
                            );
                          }}
                        >
                          &#x22EE;
                        </IconButton>
                      </div>
                      {controller.openMenuInstanceId === instance.id ? (
                        <div
                          className="fixed right-5 top-[9.5rem] z-[80] w-44 rounded-md border border-border-subtle bg-surface py-1 shadow-md"
                          onClick={stopMenuClick}
                        >
                          <MenuItem onClick={() => handleViewInstance(instance)}>
                            View details
                          </MenuItem>
                          <MenuItem onClick={() => handleEditInstance(instance)}>
                            Edit
                          </MenuItem>
                          <MenuItem
                            destructive
                            onClick={() => handleRemoveInstance(instance.id)}
                          >
                            Remove
                          </MenuItem>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-2 text-sm text-text-tertiary">
                  No AI instances added.
                </p>
              )}
            </div>
          ) : null}
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={(event) => {
              stopMenuClick(event);
              controller.setOpenMenuInstanceId(null);
              controller.setIsRoomMenuOpen(false);
              setIsMobileAIListOpen(false);
              controller.setIsRolePickerOpen((open) => !open);
            }}
            className="h-11 whitespace-nowrap rounded-md border border-accent bg-surface px-3 text-sm font-medium text-accent hover:bg-accent-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:h-9 cursor-pointer"
          >
            + Add AI
          </button>
          {controller.isRolePickerOpen ? (
            <div
              className="fixed inset-x-3 top-28 z-50 max-h-[calc(100dvh-9rem)] overflow-y-auto overscroll-contain rounded-md border border-border-subtle bg-surface p-4 shadow-sm sm:absolute sm:inset-auto sm:right-0 sm:top-10 sm:mt-0 sm:max-h-[calc(100dvh-8rem)] sm:w-80"
              onClick={stopMenuClick}
            >
              <RolePicker controller={controller} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
