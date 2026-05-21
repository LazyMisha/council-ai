import { getRoleAccent } from "../domain/role-colors";
import type { Message } from "../domain/types";

type MessageBubbleProps = {
  message: Message;
  isTyping?: boolean;
};

export function MessageBubble({ message, isTyping = false }: MessageBubbleProps) {
  const isUser = message.authorType === "user";
  const accent = message.role ? getRoleAccent(message.role) : null;
  const hasContent = message.content.trim().length > 0;

  return (
    <article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[82%] rounded-lg border border-border-subtle bg-surface px-4 py-3">
        {!isUser && message.role && accent ? (
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: accent.dot }}
            />
            <span style={{ color: accent.text }}>{message.role}</span>
            {isTyping ? (
              <span className="text-text-tertiary">typing...</span>
            ) : null}
          </p>
        ) : null}
        {hasContent ? (
          <p className="text-base leading-7 text-text-secondary md:text-sm md:leading-6">
            {message.content}
          </p>
        ) : null}
      </div>
    </article>
  );
}
