/** Copy with multiple MIME types to clipboard */
export async function copyToClipboard(items: Record<string, string>): Promise<void> {
  try {
    const clipboardItem = new ClipboardItem(
      Object.fromEntries(
        Object.entries(items).map(([mime, text]) => [mime, new Blob([text], { type: mime })]),
      ),
    );
    await navigator.clipboard.write([clipboardItem]);
  } catch {
    // Fallback: write text/plain only
    const plain = items["text/plain"];
    if (plain) {
      await navigator.clipboard.writeText(plain);
    }
  }
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
