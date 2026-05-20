import type { HTMLAttributes } from "react";
import { cn } from "./class-names";

type PopoverPanelProps = HTMLAttributes<HTMLDivElement> & {
  width?: "sm" | "md";
};

export function PopoverPanel({
  className,
  width = "sm",
  ...props
}: PopoverPanelProps) {
  return (
    <div
      className={cn(
        "absolute top-full z-30 mt-1 rounded-md border border-border-subtle bg-surface shadow-sm",
        width === "md" ? "w-80 p-4" : "w-44 py-1",
        className,
      )}
      {...props}
    />
  );
}
