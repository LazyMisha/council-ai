import type { MouseEvent, ReactNode } from "react";
import { cn } from "./class-names";

type DialogProps = {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  onClose: () => void;
  title: string;
  closeLabel?: string | null;
};

export function Dialog({
  children,
  className,
  closeLabel = "Close",
  footer,
  onClose,
  title,
}: DialogProps) {
  const stopClick = (event: MouseEvent<HTMLDivElement>) => {
    event.nativeEvent.stopImmediatePropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-32"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${title.toLowerCase().replace(/\W+/g, "-")}-title`}
        className={cn(
          "w-80 rounded-md border border-border-subtle bg-surface p-4 shadow-sm",
          className,
        )}
        onClick={stopClick}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3
            id={`${title.toLowerCase().replace(/\W+/g, "-")}-title`}
            className="text-base font-medium"
          >
            {title}
          </h3>
          {closeLabel !== null ? (
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-text-tertiary hover:text-foreground cursor-pointer"
            >
              {closeLabel}
            </button>
          ) : null}
        </div>
        {children}
        {footer ? <div className="mt-3">{footer}</div> : null}
      </div>
    </div>
  );
}
