import { t } from "../lib/i18n";
import { SettingsRoot } from "./header/SettingsModal";
import WasmStatus from "./header/WasmStatus";

interface HeaderProps {
  isImport: boolean;
  onBack: () => void;
}

export default function Header({ isImport, onBack }: HeaderProps) {
  return (
    <header class="flex items-center gap-4 border-b border-border bg-surface px-6 py-4">
      {!isImport && (
        <button
          class="shrink-0 cursor-pointer rounded-lg border border-border bg-transparent px-3 py-2 text-base leading-none text-text-secondary transition-[background,border-color] duration-150 hover:border-border-strong hover:bg-surface2"
          aria-label={t("header.back")}
          onClick={onBack}
        >
          ←
        </button>
      )}
      <h1 class="text-lg font-bold">Aggy</h1>
      <span class="text-xs tracking-[0.08em] text-muted">{t("header.subtitle")}</span>
      <div class="ml-auto flex items-center gap-3">
        <WasmStatus />
        <SettingsRoot />
      </div>
    </header>
  );
}
