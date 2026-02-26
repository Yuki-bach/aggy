interface LoadedInfoProps {
  info: string | null;
}

export function LoadedInfo({ info }: LoadedInfoProps) {
  if (!info) return null;

  return (
    <div
      class="mt-3 whitespace-pre-line rounded-lg border border-accent-light bg-accent-bg px-4 py-3 text-[0.875rem] leading-normal text-text-secondary"
      aria-live="polite"
    >
      {info}
    </div>
  );
}
