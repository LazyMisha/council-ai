import type { ChatRoomController } from "../client/use-chat-room-controller";
import { Button, Field, TextArea, TextInput } from "@/components/ui";

type RolePickerProps = {
  controller: ChatRoomController;
};

export function RolePicker({ controller }: RolePickerProps) {
  return (
    <div className="min-w-0">
      <div className="mb-3 flex border-b border-border-subtle">
        <button
          type="button"
          onClick={() => controller.setActiveTab("predefined")}
          className={`min-h-11 px-3 pb-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:min-h-0 ${
            controller.activeTab === "predefined"
              ? "border-b-2 border-accent text-foreground"
              : "text-text-secondary"
          } cursor-pointer`}
        >
          Predefined
        </button>
        <button
          type="button"
          onClick={() => controller.setActiveTab("custom")}
          className={`min-h-11 px-3 pb-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:min-h-0 ${
            controller.activeTab === "custom"
              ? "border-b-2 border-accent text-foreground"
              : "text-text-secondary"
          } cursor-pointer`}
        >
          Custom
        </button>
      </div>

      {controller.activeTab === "predefined" ? (
        <div className="space-y-1">
          {controller.predefinedRoles.map((role) => {
            const isAdded = controller.activeNames.includes(role.name);

            return (
              <button
                key={role.name}
                type="button"
                disabled={isAdded}
                onClick={() => controller.addPredefinedAIInstance(role)}
                className="block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <div className="font-medium text-foreground">
                  {role.name}
                  {isAdded ? " added" : ""}
                </div>
                <div className="mt-0.5 text-xs text-text-tertiary">
                  {role.description}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <Field htmlFor="custom-name" label="Name">
            <TextInput
              id="custom-name"
              type="text"
              value={controller.customName}
              onChange={(event) => {
                controller.setCustomName(event.target.value);
                controller.setError(null);
              }}
              placeholder="e.g. Legal Reviewer"
            />
          </Field>
          <Field htmlFor="custom-instructions" label="Instructions">
            <TextArea
              id="custom-instructions"
              value={controller.customInstructions}
              onChange={(event) => {
                controller.setCustomInstructions(event.target.value);
                controller.setError(null);
              }}
              placeholder="What should this AI instance focus on?"
              rows={3}
            />
          </Field>
          <Field htmlFor="custom-description" label="Description" optional>
            <TextInput
              id="custom-description"
              type="text"
              value={controller.customDescription}
              onChange={(event) =>
                controller.setCustomDescription(event.target.value)
              }
              placeholder="Short description"
            />
          </Field>

          {controller.error ? (
            <p className="text-sm text-red-500">{controller.error}</p>
          ) : null}

          <Button
            variant="primary"
            fullWidth
            onClick={controller.addCustomAIInstance}
          >
            Add AI Instance
          </Button>
        </div>
      )}
    </div>
  );
}
