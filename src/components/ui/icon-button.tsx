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
        "inline-flex shrink-0 items-center justify-center rounded text-text-tertiary hover:bg-surface-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm"
          ? "h-8 w-8 md:h-5 md:w-5"
          : "h-11 w-11 md:h-6 md:w-6",
        className,
      )}
      {...props}
    />
  );
}
