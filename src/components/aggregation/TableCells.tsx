import type { JSX } from "preact";

export const TH_BASE = "py-3 px-4 text-xs font-bold tracking-wide border-b-2 border-border-strong";
export const TD_BASE = "py-3 px-4 border-b border-row-border leading-[1.2]";
export const MONO = "text-right tabular-nums font-mono";

interface ThProps extends JSX.HTMLAttributes<HTMLTableCellElement> {
  right?: boolean;
}

export function Th({ right, class: cls, children, ...props }: ThProps) {
  return (
    <th
      class={`py-3 px-4 text-xs font-bold tracking-wide border-b-2 border-border-strong text-text-secondary bg-surface2 ${right ? "text-right" : "text-left"} ${String(cls ?? "")}`}
      {...props}
    >
      {children}
    </th>
  );
}

interface TdProps extends JSX.HTMLAttributes<HTMLTableCellElement> {
  right?: boolean;
  mono?: boolean;
}

export function Td({ right, mono, class: cls, children, ...props }: TdProps) {
  return (
    <td
      class={`py-3 px-4 border-b border-row-border leading-[1.2] ${right ? "text-right" : ""} ${mono ? "tabular-nums font-mono" : ""} ${String(cls ?? "")}`}
      {...props}
    >
      {children}
    </td>
  );
}
