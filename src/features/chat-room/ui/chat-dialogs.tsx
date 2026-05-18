import type { ChatRoomController } from "../client/use-chat-room-controller";
import { Button, Dialog, Field, TextArea, TextInput } from "@/components/ui";

type ChatDialogsProps = {
  controller: ChatRoomController;
};

export function ChatDialogs({ controller }: ChatDialogsProps) {
  return (
    <>
      {controller.viewingInstance ? (
        <Dialog
          title={controller.viewingInstance.name}
          onClose={() => controller.setViewingInstance(null)}
        >
          {controller.viewingInstance.description ? (
            <p className="mb-3 text-sm text-text-secondary">
              {controller.viewingInstance.description}
            </p>
          ) : null}
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-foreground">Instructions:</span>{" "}
            {controller.viewingInstance.instructions}
          </p>
        </Dialog>
      ) : null}

      {controller.editingInstance ? (
        <Dialog
          title="Edit AI Instance"
          closeLabel="Cancel"
          onClose={() => controller.setEditingInstance(null)}
        >
          <div className="space-y-3">
            <Field htmlFor="edit-name" label="Name">
              <TextInput
                id="edit-name"
                type="text"
                value={controller.editName}
                onChange={(event) => {
                  controller.setEditName(event.target.value);
                  controller.setEditError(null);
                }}
              />
            </Field>
            <Field htmlFor="edit-instructions" label="Instructions">
              <TextArea
                id="edit-instructions"
                value={controller.editInstructions}
                onChange={(event) => {
                  controller.setEditInstructions(event.target.value);
                  controller.setEditError(null);
                }}
                rows={3}
              />
            </Field>
            <Field htmlFor="edit-description" label="Description" optional>
              <TextInput
                id="edit-description"
                type="text"
                value={controller.editDescription}
                onChange={(event) =>
                  controller.setEditDescription(event.target.value)
                }
              />
            </Field>

            {controller.editError ? (
              <p className="text-sm text-red-500">{controller.editError}</p>
            ) : null}

            <Button variant="primary" fullWidth onClick={controller.saveEditInstance}>
              Save
            </Button>
          </div>
        </Dialog>
      ) : null}

      {controller.isRenaming ? (
        <Dialog
          title="Rename chat room"
          closeLabel="Cancel"
          onClose={() => controller.setIsRenaming(false)}
        >
          <div className="space-y-3">
            <TextInput
              type="text"
              value={controller.renameValue}
              onChange={(event) => {
                controller.setRenameValue(event.target.value);
                controller.setRenameError(null);
              }}
            />
            {controller.renameError ? (
              <p className="text-sm text-red-500">{controller.renameError}</p>
            ) : null}
            <Button variant="primary" fullWidth onClick={controller.saveRename}>
              Save
            </Button>
          </div>
        </Dialog>
      ) : null}

      {controller.confirmingDelete ? (
        <Dialog
          title="Delete chat room?"
          closeLabel={null}
          onClose={() => controller.setConfirmingDelete(false)}
        >
          <p className="mt-1 text-sm text-text-secondary">
            This will remove the chat room and all its messages.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 bg-background font-medium"
              onClick={() => controller.setConfirmingDelete(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={controller.executeDeleteRoom}
            >
              Delete
            </Button>
          </div>
        </Dialog>
      ) : null}

      {controller.confirmingClear ? (
        <Dialog
          title="Clear messages?"
          closeLabel={null}
          onClose={() => controller.setConfirmingClear(false)}
        >
          <p className="mt-1 text-sm text-text-secondary">
            This will remove all messages. AI instances will stay.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 bg-background font-medium"
              onClick={() => controller.setConfirmingClear(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-accent-muted hover:bg-accent hover:text-white"
              onClick={controller.executeClearMessages}
            >
              Clear
            </Button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
