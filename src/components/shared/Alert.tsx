import type { ComponentChildren } from "preact";

const VARIANT_STYLES = {
  error: "border-error-border bg-error-bg text-danger",
  warning: "border-warning-border bg-warning-bg text-warning",
  info: "border-accent-light bg-accent-bg text-text-secondary",
} as const;

interface AlertProps {
  variant: keyof typeof VARIANT_STYLES;
  role?: "alert" | "status";
  class?: string;
  children: ComponentChildren;
}

export function Alert({ variant, role = "alert", class: cls, children }: AlertProps) {
  return (
    <div
      class={`rounded-lg border px-4 py-3 text-sm leading-normal ${VARIANT_STYLES[variant]} ${cls ?? ""}`}
      role={role}
    >
      {children}
    </div>
  );
}
