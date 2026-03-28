import { describe, it, expect } from "vite-plus/test";
import { hasUnreadChanges, markChangelogSeen } from "../src/lib/changelog";

// Polyfill localStorage for Node test environment
const store = new Map<string, string>();
if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  });
}

describe("changelog", () => {
  it("hasUnreadChanges returns true when localStorage is empty", () => {
    expect(hasUnreadChanges()).toBe(true);
  });

  it("hasUnreadChanges returns false after markChangelogSeen", () => {
    markChangelogSeen();
    expect(hasUnreadChanges()).toBe(false);
  });

  it("hasUnreadChanges returns true when stored version differs", () => {
    localStorage.setItem("aggy-changelog-seen", "0.0.0");
    expect(hasUnreadChanges()).toBe(true);
  });
});
