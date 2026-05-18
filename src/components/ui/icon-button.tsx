import type { ButtonHTMLAttributes } from "react";
import { cn } from "./class-names";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  "aria-label": string;
  size?: "sm" | "md";
};

export function IconButton({
  className,
  size = "md",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded text-text-tertiary hover:bg-surface-muted hover:text-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-5 w-5" : "h-6 w-6",
        className,
      )}
      {...props}
    />
  );
}
