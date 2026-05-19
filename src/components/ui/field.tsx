import type { HTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "./class-names";

type FieldProps = HTMLAttributes<HTMLDivElement> & {
  htmlFor: string;
  label: string;
  optional?: boolean;
};

export function Field({
  children,
  className,
  htmlFor,
  label,
  optional = false,
  ...props
}: FieldProps) {
  return (
    <div className={className} {...props}>
      <label htmlFor={htmlFor} className="mb-1 block text-sm text-text-secondary">
        {label}{" "}
        {optional ? (
          <span className="text-text-tertiary">(optional)</span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-border-subtle bg-background px-3 text-sm outline-none placeholder:text-text-tertiary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-muted md:h-9",
        className,
      )}
      {...props}
    />
  );
}

export function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-md border border-border-subtle bg-background px-3 py-2 text-sm outline-none placeholder:text-text-tertiary focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent-muted",
        className,
      )}
      {...props}
    />
  );
}
