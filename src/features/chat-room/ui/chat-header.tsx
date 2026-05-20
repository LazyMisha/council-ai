"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import type { AIInstance } from "../domain/types";
import type { ChatRoomController } from "../client/use-chat-room-controller";
import { Button, IconButton, MenuItem } from "@/components/ui";
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

  const toggleRolePicker = (event: MouseEvent<HTMLButtonElement>) => {
    stopMenuClick(event);
    controller.setOpenMenuInstanceId(null);
    controller.setIsRoomMenuOpen(false);
    setIsMobileAIListOpen(false);
    controller.setIsRolePickerOpen((open) => !open);
  };

  return (
    <div className="shrink-0 border-b border-border-subtle bg-surface pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2 sm:px-5 lg:max-w-4xl">
        <div className="relative flex min-w-0 flex-1 items-center gap-1">
          <IconButton
            aria-label="Open chat room navigation"
            className="h-12 w-12 rounded-md text-lg md:hidden"
            onClick={(event) => onOpenMobileDrawer(event.currentTarget)}
          >
            &#x2630;
          </IconButton>
          <h2 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground sm:text-lg">
            {activeRoom.title}
          </h2>
        </div>
        <div className="relative min-w-0 sm:hidden">
          <Button
            aria-expanded={isMobileAIListOpen}
            aria-label="Show added AI instances"
            variant="primary"
            onClick={(event) => {
              stopMenuClick(event);
              controller.setOpenMenuInstanceId(null);
              controller.setIsRolePickerOpen(false);
              setIsMobileAIListOpen((open) => !open);
            }}
            className="h-11 min-w-14 max-w-20 px-2.5 md:h-9"
          >
            {aiInstanceCount} AI
          </Button>
          {isMobileAIListOpen ? (
            <div
              aria-label="Added AI instances"
              className="fixed inset-x-3 top-[calc(4rem+env(safe-area-inset-top))] z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain rounded-md border border-border-subtle bg-surface p-1 shadow-sm"
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
                          className="fixed right-5 top-[calc(5.5rem+env(safe-area-inset-top))] z-[80] w-44 rounded-md border border-border-subtle bg-surface py-1 shadow-md"
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
          <Button
            aria-label="+ Add AI"
            variant="primary"
            onClick={toggleRolePicker}
            className="h-11 md:h-9"
          >
            + Add AI
          </Button>
          {controller.isRolePickerOpen ? (
            <div
              className="fixed inset-x-3 top-[calc(4rem+env(safe-area-inset-top))] z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain rounded-md border border-border-subtle bg-surface p-4 shadow-sm sm:absolute sm:inset-auto sm:right-0 sm:top-10 sm:mt-0 sm:max-h-[calc(100dvh-8rem)] sm:w-80"
              onClick={stopMenuClick}
            >
              <RolePicker controller={controller} />
            </div>
          ) : null}
        </div>
      </div>
      <div className="mx-auto hidden max-w-3xl items-center gap-2 px-3 pb-3 sm:flex sm:px-5 lg:max-w-4xl">
        <div className="-mx-1 flex min-w-0 flex-1 flex-wrap gap-2 overflow-visible px-1">
          {activeRoom.aiInstances.map((instance) => (
            <RoleChip
              key={instance.id}
              controller={controller}
              instance={instance}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
