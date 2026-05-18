import type { ButtonHTMLAttributes } from "react";
import { cn } from "./class-names";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerSubtle";
type ButtonSize = "xs" | "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-surface text-accent font-medium hover:bg-accent-muted",
  secondary:
    "border-border-subtle bg-surface text-text-secondary hover:bg-background",
  ghost:
    "border-transparent bg-transparent text-text-tertiary hover:bg-surface-muted hover:text-foreground",
  danger: "border-red-500 bg-red-500 text-white font-medium",
  dangerSubtle:
    "border-red-500/50 bg-red-500/10 text-red-600 font-medium hover:bg-red-500/20",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-xs",
  sm: "h-8 px-3 text-sm",
  md: "h-9 px-3 text-sm",
  lg: "h-10 px-4 text-sm",
};

export function Button({
  className,
  fullWidth = false,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
