import { getRoleAccent } from "../domain/role-colors";
import type { Message } from "../domain/types";

type MessageBubbleProps = {
  message: Message;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.authorType === "user";
  const accent = message.role ? getRoleAccent(message.role) : null;

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
          </p>
        ) : null}
        <p className="text-base leading-7 text-text-secondary md:text-sm md:leading-6">
          {message.content}
        </p>
      </div>
    </article>
  );
}
