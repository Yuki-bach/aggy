<script lang="ts">
  import { t, getLocale } from "../../lib/i18n.svelte";
  import { clickOutside } from "../../lib/dismiss";
  import { changelog, hasUnreadChanges, markChangelogSeen } from "../../lib/changelog";
  import IconButton from "../shared/IconButton.svelte";

  let open = $state(false);
  let hasUnread = $state(hasUnreadChanges());

  function toggle() {
    open = !open;
    if (open && hasUnread) {
      markChangelogSeen();
      hasUnread = false;
    }
  }
</script>

<div class="relative" {@attach clickOutside({ onClose: () => (open = false) })}>
  <div class="relative">
    <IconButton size="md" label={t("changelog.title")} onclick={toggle}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    </IconButton>
    {#if hasUnread}
      <span class="absolute top-0.5 right-0.5 size-2.5 rounded-full bg-red-500"></span>
    {/if}
  </div>

  {#if open}
    <div
      class="absolute right-0 z-10 mt-1 min-w-64 rounded-lg border border-border bg-surface shadow-lg"
    >
      <div class="px-3 pt-2.5 pb-1 text-sm font-medium tracking-wide text-muted uppercase">
        {t("changelog.title")}
      </div>
      <div class="max-h-64 overflow-y-auto pb-2">
        {#each changelog as entry (entry.version)}
          <div class="px-3 py-2">
            <div class="flex items-baseline gap-2">
              <span class="text-xs font-bold text-text">v{entry.version}</span>
              <span class="text-xs text-muted">{entry.date}</span>
            </div>
            <ul class="mt-1 list-disc pl-4">
              {#each entry.changes as change}
                <li class="text-xs text-text-secondary">
                  {change[getLocale()]}
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
