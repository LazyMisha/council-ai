import type { ChatRoomController } from "../client/use-chat-room-controller";
import { IconButton, MenuItem, PopoverPanel } from "@/components/ui";
import { stopMenuClick } from "./events";
import { RoleChip } from "./role-chip";
import { RolePicker } from "./role-picker";

type ChatHeaderProps = {
  controller: ChatRoomController;
};

export function ChatHeader({ controller }: ChatHeaderProps) {
  const activeRoom = controller.activeRoom;
  if (!activeRoom) return null;

  return (
    <div className="shrink-0 border-b border-border-subtle bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-2 lg:max-w-4xl">
        <div className="relative flex items-center gap-1">
          <h2 className="text-lg font-semibold text-foreground">
            {activeRoom.title}
          </h2>
          <IconButton
            aria-label="Chat room options"
            onClick={(event) => {
              stopMenuClick(event);
              controller.setOpenMenuInstanceId(null);
              controller.setIsRolePickerOpen(false);
              controller.setIsRoomMenuOpen((open) => !open);
            }}
          >
            &#x22EE;
          </IconButton>
          {controller.isRoomMenuOpen ? (
            <PopoverPanel className="left-0" onClick={stopMenuClick}>
              <MenuItem onClick={controller.startRename}>Rename</MenuItem>
              <MenuItem
                onClick={() => {
                  controller.setConfirmingClear(true);
                  controller.setIsRoomMenuOpen(false);
                }}
              >
                Clear messages
              </MenuItem>
              <MenuItem
                destructive
                onClick={() => {
                  controller.setConfirmingDelete(true);
                  controller.setIsRoomMenuOpen(false);
                }}
              >
                Delete chat room
              </MenuItem>
            </PopoverPanel>
          ) : null}
        </div>
      </div>
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 lg:max-w-4xl">
        <div className="flex flex-wrap gap-2">
          {activeRoom.aiInstances.map((instance) => (
            <RoleChip
              key={instance.id}
              controller={controller}
              instance={instance}
            />
          ))}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={(event) => {
              stopMenuClick(event);
              controller.setOpenMenuInstanceId(null);
              controller.setIsRoomMenuOpen(false);
              controller.setIsRolePickerOpen((open) => !open);
            }}
            className="h-9 rounded-md border border-accent bg-surface px-3 text-sm font-medium text-accent hover:bg-accent-muted cursor-pointer"
          >
            + Add AI
          </button>
          {controller.isRolePickerOpen ? (
            <PopoverPanel
              width="md"
              className="right-0 top-10 mt-0"
              onClick={stopMenuClick}
            >
              <RolePicker controller={controller} />
            </PopoverPanel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
