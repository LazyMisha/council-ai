import type { FormEvent, KeyboardEvent } from "react";
import type { ChatRoomController } from "../client/use-chat-room-controller";
import { Button } from "@/components/ui";

type ChatComposerProps = {
  controller: ChatRoomController;
};

export function ChatComposer({ controller }: ChatComposerProps) {
  const activeRoom = controller.activeRoom;
  if (!activeRoom) return null;

  const hasAIInstances = activeRoom.aiInstances.length > 0;
  const canAutoDiscuss = activeRoom.aiInstances.length > 1;
  const canSend = hasAIInstances && !controller.isAutoDiscussing;
  const showDiscussionActions =
    controller.isAutoDiscussing ||
    canAutoDiscuss ||
    activeRoom.canSummarize ||
    controller.hasSummary;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;

    void controller.sendMessage();
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!canSend) return;

      void controller.sendMessage();
    }
  };

  return (
    <div className="shrink-0 border-t border-border-subtle bg-surface px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:px-5">
      <div className="mx-auto max-w-3xl lg:max-w-4xl">
        {!hasAIInstances ? (
          <p className="mb-3 text-sm text-text-tertiary">
            Add AI instances to start a discussion.
          </p>
        ) : null}

        {controller.hasAIDiscussionRound && showDiscussionActions ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {controller.isAutoDiscussing ? (
              <>
                <Button
                  variant="dangerSubtle"
                  size="sm"
                  onClick={controller.stopAutoDiscuss}
                  disabled={controller.isStoppingAutoDiscuss}
                >
                  {controller.isStoppingAutoDiscuss ? "Stopping..." : "Stop"}
                </Button>
                {controller.isStoppingAutoDiscuss ? (
                  <p className="self-center text-sm text-text-tertiary">
                    Stopping after this response...
                  </p>
                ) : null}
              </>
            ) : canAutoDiscuss ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={controller.autoDiscuss}
                disabled={controller.isAutoDiscussing || controller.isThinking}
              >
                Auto-discuss
              </Button>
            ) : null}
            {activeRoom.canSummarize || controller.hasSummary ? (
              <Button
                variant="primary"
                size="sm"
                onClick={controller.summarizeDiscussion}
                disabled={controller.isThinking}
              >
                Summarize
              </Button>
            ) : null}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="flex min-w-0 gap-2 rounded-lg border border-border-subtle bg-surface p-2 sm:gap-3 sm:p-3"
        >
          <input
            value={controller.draft}
            onChange={(event) => controller.setDraft(event.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={controller.isAutoDiscussing}
            aria-label="Start a topic or reply"
            placeholder="Start a topic or reply..."
            className="h-11 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-text-tertiary focus-visible:ring-2 focus-visible:ring-accent-muted"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!canSend}
            className="h-11 px-4"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
