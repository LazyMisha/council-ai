import type { ButtonHTMLAttributes } from "react";
import { cn } from "./class-names";

type MenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  destructive?: boolean;
};

export function MenuItem({
  className,
  destructive = false,
  type = "button",
  ...props
}: MenuItemProps) {
  return (
    <button
      type={type}
      className={cn(
        "block w-full px-3 py-1.5 text-left text-sm hover:bg-background cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        destructive ? "text-red-500" : "text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}
