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
        "block min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-accent md:min-h-0 md:py-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        destructive ? "text-red-500" : "text-text-secondary",
        className,
      )}
      {...props}
    />
  );
}
