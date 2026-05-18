import type { ChatRoomController } from "../client/use-chat-room-controller";
import { Button } from "@/components/ui";

type ChatSidebarProps = {
  controller: ChatRoomController;
};

export function ChatSidebar({ controller }: ChatSidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 overflow-hidden border-r border-border-subtle bg-surface p-4 md:flex md:flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">CouncilAI</h1>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        className="mt-4"
        onClick={controller.createChatRoom}
      >
        + New chat room
      </Button>

      <div className="mt-4 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {controller.chatRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => controller.selectChatRoom(room.id)}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
                controller.activeRoom && room.id === controller.activeRoom.id
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
  );
}
