import type { RefObject } from "react";
import type { ChatRoom } from "../domain/types";
import { MessageBubble } from "./message-bubble";
import { SummaryMessage } from "./summary-message";

type MessageListProps = {
  activeRoom: ChatRoom;
  containerRef: RefObject<HTMLDivElement | null>;
  isThinking: boolean;
  scrollToBottom: () => void;
  showScrollButton: boolean;
};

export function MessageList({
  activeRoom,
  containerRef,
  isThinking,
  scrollToBottom,
  showScrollButton,
}: MessageListProps) {
  return (
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-y-auto px-5 pt-10 pb-20"
    >
      <div className="mx-auto max-w-3xl lg:max-w-4xl">
        {activeRoom.messages.length === 0 ? (
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-semibold">
              Create a chat room to start a discussion
            </h2>
          </div>
        ) : null}

        <div className="space-y-5">
          {activeRoom.messages.map((message) => {
            if (message.authorType === "system") {
              return (
                <p key={message.id} className="text-sm text-text-tertiary">
                  {message.content}
                </p>
              );
            }

            if (message.authorType === "summary") {
              return <SummaryMessage key={message.id} message={message} />;
            }

            return <MessageBubble key={message.id} message={message} />;
          })}

          {isThinking ? (
            <p className="text-sm text-text-tertiary">
              AI instances are thinking...
            </p>
          ) : null}

          {showScrollButton ? (
            <button
              type="button"
              onClick={scrollToBottom}
              className="fixed bottom-28 right-8 z-10 flex h-8 items-center gap-1.5 rounded-full border border-border-subtle bg-surface px-3 text-xs font-medium text-text-secondary shadow-sm hover:bg-accent-muted hover:text-accent"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              New messages
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
