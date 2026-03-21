import type { ComponentChildren } from "preact";
import type { JSX } from "preact/jsx-runtime";

export function Button({
  variant = "secondary",
  size = "md",
  children,
  ...rest
}: {
  variant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg";
  children: ComponentChildren;
} & Omit<JSX.HTMLAttributes<HTMLButtonElement>, "size">) {
  return (
    <button class={`${base} ${variants[variant]} ${sizes[size]}`} {...rest}>
      {children}
    </button>
  );
}

// ─── Internal ───────────────────────────────────────────────

const base =
  "cursor-pointer rounded-lg transition-[background,color,border-color] duration-150 disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary:
    "border-none bg-accent text-accent-contrast font-bold hover:bg-accent-hover active:bg-[var(--color-primary-900)]",
  secondary: "border border-border bg-surface text-text font-medium hover:bg-surface2",
  ghost: "border-none bg-transparent text-text font-normal hover:bg-accent-bg",
} as const;

const sizes = {
  md: "px-4 py-2 text-sm",
  lg: "min-h-12 px-4 py-3 text-base tracking-wide",
} as const;
