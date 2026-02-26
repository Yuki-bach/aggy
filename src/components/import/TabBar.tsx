import { useRef } from "preact/hooks";
import type { JSX } from "preact";
import { t } from "../../lib/i18n";

interface TabDef {
  key: string;
  labelKey: string;
}

interface TabBarProps {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function activateTab(idx: number) {
    onTabChange(tabs[idx].key);
    tabRefs.current[idx]?.focus();
  }

  function handleKeyDown(e: JSX.TargetedKeyboardEvent<HTMLButtonElement>, idx: number) {
    const len = tabs.length;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      activateTab((idx + 1) % len);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      activateTab((idx - 1 + len) % len);
    } else if (e.key === "Home") {
      e.preventDefault();
      activateTab(0);
    } else if (e.key === "End") {
      e.preventDefault();
      activateTab(len - 1);
    }
  }

  return (
    <div class="mb-3 flex" role="tablist" aria-label={t("import.tab.label")}>
      {tabs.map((tab, i) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            class="flex-1 cursor-pointer border border-border bg-surface px-0 py-2 text-[0.875rem] font-medium text-text-secondary transition-[background,color,border-color] duration-150 first:rounded-l-sm last:rounded-r-sm last:border-l-0 data-[active=true]:border-accent data-[active=true]:bg-accent data-[active=true]:text-accent-contrast"
            role="tab"
            aria-selected={isActive}
            aria-controls={`tab-${tab.key}`}
            data-active={String(isActive)}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.key)}
            onKeyDown={(e) => handleKeyDown(e, i)}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
