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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/20 px-4 py-[max(1rem,env(safe-area-inset-top))] sm:py-16"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${title.toLowerCase().replace(/\W+/g, "-")}-title`}
        className={cn(
          "max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-md border border-border-subtle bg-surface p-4 shadow-sm",
          className,
        )}
        onClick={stopClick}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3
            id={`${title.toLowerCase().replace(/\W+/g, "-")}-title`}
            className="min-w-0 text-base font-medium"
          >
            {title}
          </h3>
          {closeLabel !== null ? (
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 shrink-0 whitespace-nowrap rounded px-2 text-sm text-text-tertiary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:min-h-0 cursor-pointer"
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
