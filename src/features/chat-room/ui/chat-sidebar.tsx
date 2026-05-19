import type { ChatRoomController } from "../client/use-chat-room-controller";
import { Button, IconButton, MenuItem, PopoverPanel } from "@/components/ui";
import { cn } from "@/components/ui/class-names";
import { stopMenuClick } from "./events";

type ChatSidebarProps = {
  controller: ChatRoomController;
  onClose?: () => void;
  onCreateRoom?: () => void;
  onSelectRoom?: (roomId: string) => void;
  variant?: "desktop" | "drawer";
};

export function ChatSidebar({
  controller,
  onClose,
  onCreateRoom,
  onSelectRoom,
  variant = "desktop",
}: ChatSidebarProps) {
  const isDrawer = variant === "drawer";
  const createRoom = onCreateRoom ?? controller.createChatRoom;
  const selectRoom = onSelectRoom ?? controller.selectChatRoom;

  return (
    <aside
      aria-label="Chat rooms"
      className={cn(
        "shrink-0 overflow-hidden border-border-subtle bg-surface p-4",
        isDrawer
          ? "flex h-full w-full max-w-full flex-col"
          : "hidden w-72 border-r md:flex md:flex-col",
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-lg font-semibold">CouncilAI</h1>
        {isDrawer ? (
          <IconButton aria-label="Close chat room navigation" onClick={onClose}>
            &#x2715;
          </IconButton>
        ) : null}
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-4"
        onClick={createRoom}
      >
        + New chat room
      </Button>

      <div
        className={cn(
          "mt-4 flex-1 overflow-y-auto",
          isDrawer && "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        <div className="space-y-1">
          {controller.chatRooms.map((room) => {
            const isActive = Boolean(
              controller.activeRoom && room.id === controller.activeRoom.id,
            );
            const isMenuOpen = controller.openRoomMenuId === room.id;

            return (
              <div key={room.id} className="relative flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => selectRoom(room.id)}
                  className={cn(
                    "block min-h-11 min-w-0 flex-1 rounded-md px-3 py-2 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer",
                    isActive
                      ? "font-medium text-foreground"
                      : "text-text-secondary hover:bg-background",
                  )}
                >
                  <span className="block min-w-0 truncate">{room.title}</span>
                </button>
                <IconButton
                  aria-label={`${room.title} options`}
                  onClick={(event) => {
                    stopMenuClick(event);
                    controller.setOpenMenuInstanceId(null);
                    controller.setIsRolePickerOpen(false);
                    controller.setOpenRoomMenuId(
                      isMenuOpen ? null : room.id,
                    );
                  }}
                >
                  &#x22EE;
                </IconButton>
                {isMenuOpen ? (
                  <PopoverPanel
                    className="right-0 left-auto top-9 z-20"
                    onClick={stopMenuClick}
                  >
                    <MenuItem onClick={() => controller.startRenameRoom(room.id)}>
                      Rename
                    </MenuItem>
                    <MenuItem onClick={() => controller.startClearRoom(room.id)}>
                      Clear messages
                    </MenuItem>
                    <MenuItem
                      destructive
                      onClick={() => controller.startDeleteRoom(room.id)}
                    >
                      Delete chat room
                    </MenuItem>
                  </PopoverPanel>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
