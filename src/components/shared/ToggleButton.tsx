import type { ComponentChildren } from "preact";

export function ToggleGroup({
  class: cls,
  children,
}: {
  class?: string;
  children: ComponentChildren;
}) {
  return (
    <div
      class={`flex [&>:first-child]:rounded-l [&>:last-child]:rounded-r [&>:last-child]:border-l-0${cls ? ` ${cls}` : ""}`}
    >
      {children}
    </div>
  );
}

export function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ComponentChildren;
}) {
  return (
    <button
      class={`min-h-9 cursor-pointer border px-4 py-2 font-sans text-sm font-medium transition-[background,color,border-color] duration-150 ${active ? "border-accent bg-accent text-accent-contrast" : "border-border bg-surface text-text-secondary"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
