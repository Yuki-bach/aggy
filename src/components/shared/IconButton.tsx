import type { ComponentChildren } from "preact";
import type { JSX } from "preact/jsx-runtime";

export function IconButton({
  size = "md",
  label,
  children,
  ...rest
}: {
  size?: "sm" | "md" | "lg";
  label: string;
  children: ComponentChildren;
} & Omit<JSX.HTMLAttributes<HTMLButtonElement>, "size" | "class" | "className" | "aria-label">) {
  return (
    <button class={`${base} ${sizes[size]}`} aria-label={label} {...rest}>
      {children}
    </button>
  );
}

// ─── Internal ───────────────────────────────────────────────

const base =
  "cursor-pointer rounded-lg flex items-center justify-center text-muted transition-colors hover:bg-surface2 hover:text-text";

const sizes = {
  sm: "size-8",
  md: "size-9",
  lg: "min-h-11 min-w-11",
} as const;
