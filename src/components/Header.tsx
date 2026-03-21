import { t } from "../lib/i18n";
import { SettingsRoot } from "./header/SettingsModal";
import { IconButton } from "./shared/IconButton";
import WasmStatus from "./header/WasmStatus";

interface HeaderProps {
  isImport: boolean;
  onBack: () => void;
}

export default function Header({ isImport, onBack }: HeaderProps) {
  return (
    <header class="flex items-center gap-4 border-b border-border bg-surface px-6 py-4">
      {!isImport && (
        <IconButton label={t("header.back")} onClick={onBack}>
          ←
        </IconButton>
      )}
      <h1 class="text-lg font-bold text-text">Aggy</h1>
      <span class="text-xs tracking-widest text-muted">{t("header.subtitle")}</span>
      <div class="ml-auto flex items-center gap-3">
        <WasmStatus />
        <SettingsRoot />
      </div>
    </header>
  );
}
