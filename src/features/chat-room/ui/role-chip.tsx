import { getRoleAccent } from "../domain/role-colors";
import type { AIInstance } from "../domain/types";
import type { ChatRoomController } from "../client/use-chat-room-controller";
import { IconButton, MenuItem, PopoverPanel } from "@/components/ui";
import { stopMenuClick } from "./events";

type RoleChipProps = {
  controller: ChatRoomController;
  instance: AIInstance;
};

export function RoleChip({ controller, instance }: RoleChipProps) {
  const accent = getRoleAccent(instance.name);
  const isMenuOpen = controller.openMenuInstanceId === instance.id;

  return (
    <div className="relative">
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
        <IconButton
          aria-label={`${instance.name} options`}
          size="sm"
          className="ml-1"
          onClick={(event) => {
            stopMenuClick(event);
            controller.setIsRolePickerOpen(false);
            controller.setIsRoomMenuOpen(false);
            controller.setOpenMenuInstanceId((current) =>
              current === instance.id ? null : instance.id,
            );
          }}
        >
          &#x22EE;
        </IconButton>
      </span>
      {isMenuOpen ? (
        <PopoverPanel className="left-0 w-40" onClick={stopMenuClick}>
          <MenuItem onClick={() => controller.viewInstanceDetails(instance)}>
            View details
          </MenuItem>
          {!controller.isPredefinedName(instance.name) ? (
            <MenuItem onClick={() => controller.startEditInstance(instance)}>
              Edit
            </MenuItem>
          ) : null}
          <MenuItem
            destructive
            onClick={() => controller.removeInstance(instance.id)}
          >
            Remove
          </MenuItem>
        </PopoverPanel>
      ) : null}
    </div>
  );
}
