import type { ComponentChildren } from "preact";

interface SectionTitleProps {
  class?: string;
  children: ComponentChildren;
}

export function SectionTitle({ class: cls, children }: SectionTitleProps) {
  return <h2 class={`text-sm font-bold tracking-wider text-muted ${cls ?? "mb-3"}`}>{children}</h2>;
}
