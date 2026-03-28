import { describe, it, expect, vi, beforeEach } from "vite-plus/test";

vi.mock("@tauri-apps/api/path", () => ({
  appDataDir: vi.fn(),
  join: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  mkdir: vi.fn(),
  writeTextFile: vi.fn(),
  readTextFile: vi.fn(),
  readDir: vi.fn(),
  remove: vi.fn(),
}));

import { appDataDir, join } from "@tauri-apps/api/path";
import { mkdir, writeTextFile, readTextFile, readDir, remove } from "@tauri-apps/plugin-fs";
import { saveEntry, listEntries, loadEntry, deleteEntry } from "../src/lib/storage";

const BASE = "/app/data";
const AGGY_DIR = `${BASE}/aggy-data`;

function dirEntry(name: string, isDirectory: boolean) {
  return { name, isDirectory, isFile: !isDirectory, isSymlink: false };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(appDataDir).mockResolvedValue(BASE);
  vi.mocked(join).mockImplementation((...parts: string[]) =>
    Promise.resolve(parts.join("/")),
  );
  vi.mocked(mkdir).mockResolvedValue(undefined);
  vi.mocked(writeTextFile).mockResolvedValue(undefined);
  vi.mocked(remove).mockResolvedValue(undefined);
});

// ─── saveEntry ───────────────────────────────────────────────

describe("saveEntry", () => {
  it("フォルダを作成してCSVとJSONを書き込む", async () => {
    const entry = await saveEntry("data.csv", "csv content", "layout.json", '{"q":1}');

    expect(mkdir).toHaveBeenCalledWith(`${AGGY_DIR}/${entry.folderId}`, { recursive: true });
    expect(writeTextFile).toHaveBeenCalledWith(
      `${AGGY_DIR}/${entry.folderId}/data.csv`,
      "csv content",
    );
    expect(writeTextFile).toHaveBeenCalledWith(
      `${AGGY_DIR}/${entry.folderId}/layout.json`,
      '{"q":1}',
    );
  });

  it("返却値に正しいメタ情報が含まれる", async () => {
    const before = Date.now();
    const entry = await saveEntry("survey.csv", "", "layout.json", "");
    const after = Date.now();

    expect(entry.rawDataName).toBe("survey.csv");
    expect(entry.layoutName).toBe("layout.json");
    expect(entry.folderId).toBe(String(entry.timestamp));
    expect(entry.timestamp).toBeGreaterThanOrEqual(before);
    expect(entry.timestamp).toBeLessThanOrEqual(after);
  });
});

// ─── listEntries ─────────────────────────────────────────────

describe("listEntries", () => {
  it("フォルダ一覧をタイムスタンプ降順で返す", async () => {
    vi.mocked(readDir).mockImplementation(async (path: unknown) => {
      if (path === AGGY_DIR) {
        return [
          dirEntry("1000000000000", true),
          dirEntry("2000000000000", true),
        ];
      }
      if (path === `${AGGY_DIR}/1000000000000`) {
        return [dirEntry("a.csv", false), dirEntry("b.json", false)];
      }
      if (path === `${AGGY_DIR}/2000000000000`) {
        return [dirEntry("c.csv", false), dirEntry("d.json", false)];
      }
      return [];
    });

    const entries = await listEntries();

    expect(entries).toHaveLength(2);
    expect(entries[0].folderId).toBe("2000000000000");
    expect(entries[1].folderId).toBe("1000000000000");
  });

  it("数値でないフォルダ名はスキップする", async () => {
    vi.mocked(readDir).mockImplementation(async (path: unknown) => {
      if (path === AGGY_DIR) {
        return [
          dirEntry("not-a-number", true),
          dirEntry("also-skip", true),
          dirEntry("1000000000000", true),
        ];
      }
      if (path === `${AGGY_DIR}/1000000000000`) {
        return [dirEntry("a.csv", false), dirEntry("b.json", false)];
      }
      return [];
    });

    const entries = await listEntries();

    expect(entries).toHaveLength(1);
    expect(entries[0].folderId).toBe("1000000000000");
  });

  it("ファイルエントリ（isDirectory=false）はスキップする", async () => {
    vi.mocked(readDir).mockImplementation(async (path: unknown) => {
      if (path === AGGY_DIR) {
        return [
          dirEntry("some-file.txt", false),
          dirEntry("1000000000000", true),
        ];
      }
      if (path === `${AGGY_DIR}/1000000000000`) {
        return [dirEntry("a.csv", false), dirEntry("b.json", false)];
      }
      return [];
    });

    const entries = await listEntries();

    expect(entries).toHaveLength(1);
  });

  it("CSVまたはJSONが欠けているフォルダはスキップする", async () => {
    vi.mocked(readDir).mockImplementation(async (path: unknown) => {
      if (path === AGGY_DIR) {
        return [
          dirEntry("1000000000000", true), // CSV only
          dirEntry("2000000000000", true), // JSON only
          dirEntry("3000000000000", true), // both present
        ];
      }
      if (path === `${AGGY_DIR}/1000000000000`) {
        return [dirEntry("a.csv", false)]; // no JSON
      }
      if (path === `${AGGY_DIR}/2000000000000`) {
        return [dirEntry("b.json", false)]; // no CSV
      }
      if (path === `${AGGY_DIR}/3000000000000`) {
        return [dirEntry("c.csv", false), dirEntry("d.json", false)];
      }
      return [];
    });

    const entries = await listEntries();

    expect(entries).toHaveLength(1);
    expect(entries[0].folderId).toBe("3000000000000");
  });

  it("各エントリのrawDataNameとlayoutNameが正しく解析される", async () => {
    vi.mocked(readDir).mockImplementation(async (path: unknown) => {
      if (path === AGGY_DIR) return [dirEntry("1000000000000", true)];
      return [dirEntry("survey.csv", false), dirEntry("q_layout.json", false)];
    });

    const [entry] = await listEntries();

    expect(entry.rawDataName).toBe("survey.csv");
    expect(entry.layoutName).toBe("q_layout.json");
    expect(entry.timestamp).toBe(1000000000000);
  });
});

// ─── loadEntry ───────────────────────────────────────────────

describe("loadEntry", () => {
  it("指定フォルダのCSVとJSONを読み込んで返す", async () => {
    vi.mocked(readDir).mockResolvedValue([
      dirEntry("survey.csv", false),
      dirEntry("layout.json", false),
    ]);
    vi.mocked(readTextFile).mockImplementation(async (path: unknown) => {
      if (String(path).endsWith(".csv")) return "a,b\n1,2";
      return '{"q":1}';
    });

    const result = await loadEntry("1000000000000");

    expect(result.rawDataName).toBe("survey.csv");
    expect(result.rawDataText).toBe("a,b\n1,2");
    expect(result.layoutName).toBe("layout.json");
    expect(result.layoutJson).toBe('{"q":1}');
  });

  it("CSVまたはJSONが存在しない場合はエラーをスローする", async () => {
    vi.mocked(readDir).mockResolvedValue([dirEntry("survey.csv", false)]);

    await expect(loadEntry("1000000000000")).rejects.toThrow("不完全な保存データです");
  });
});

// ─── deleteEntry ─────────────────────────────────────────────

describe("deleteEntry", () => {
  it("指定フォルダを再帰削除する", async () => {
    await deleteEntry("1000000000000");

    expect(remove).toHaveBeenCalledWith(`${AGGY_DIR}/1000000000000`, { recursive: true });
  });
});
