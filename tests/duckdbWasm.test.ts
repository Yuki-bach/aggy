import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  WASM_SRI,
  fetchVerifiedWasmObjectUrl,
  instantiateWithVerifiedWasm,
  integrityForWasmUrl,
  wasmModuleUrl,
} from "../src/lib/duckdbWasm";

const require = createRequire(import.meta.url);
const DUCKDB_DIST = resolve(require.resolve("@duckdb/duckdb-wasm"), "..");

function fileSri(filename: string): string {
  const bytes = readFileSync(resolve(DUCKDB_DIST, filename));
  return `sha384-${createHash("sha384").update(bytes).digest("base64")}`;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("DuckDB wasm SRI", () => {
  it("mvp の SHA-384 がインストール済み 1.33.1-dev57.0 と一致する", () => {
    expect(fileSri("duckdb-mvp.wasm")).toBe(WASM_SRI.mvp);
    expect(integrityForWasmUrl(wasmModuleUrl("mvp"))).toBe(WASM_SRI.mvp);
  });

  it("eh の SHA-384 がインストール済み 1.33.1-dev57.0 と一致する", () => {
    expect(fileSri("duckdb-eh.wasm")).toBe(WASM_SRI.eh);
    expect(integrityForWasmUrl(wasmModuleUrl("eh"))).toBe(WASM_SRI.eh);
  });

  it("未知の wasm URL は SRI を返さない", () => {
    expect(() => integrityForWasmUrl(`${wasmModuleUrl("mvp")}.evil`)).toThrow(/No SRI hash/);
  });

  it("fetch に integrity を渡し、検証済みバイトの blob URL を返す", async () => {
    const payload = new Uint8Array([0x00, 0x61, 0x73, 0x6d]);
    const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
      async () => new Response(payload, { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const create = vi.spyOn(URL, "createObjectURL");

    const url = await fetchVerifiedWasmObjectUrl(wasmModuleUrl("eh"), WASM_SRI.eh);

    expect(fetchMock).toHaveBeenCalledWith(wasmModuleUrl("eh"), { integrity: WASM_SRI.eh });
    expect(url.startsWith("blob:")).toBe(true);
    const blob = create.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    if (!(blob instanceof Blob)) return;
    expect(blob.type).toBe("application/wasm");
    expect([...(await blob.bytes())]).toEqual([...payload]);
    URL.revokeObjectURL(url);
  });

  it("HTTP エラーでは blob URL を作らない", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
        async () => new Response("missing", { status: 404, statusText: "Not Found" }),
      ),
    );
    const create = vi.spyOn(URL, "createObjectURL");

    await expect(fetchVerifiedWasmObjectUrl(wasmModuleUrl("mvp"), WASM_SRI.mvp)).rejects.toThrow(
      /404 Not Found/,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("instantiate の成否にかかわらず blob URL を revoke する", async () => {
    const payload = new Uint8Array([1, 2, 3, 4]);
    vi.stubGlobal(
      "fetch",
      vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
        async () => new Response(payload, { status: 200 }),
      ),
    );
    const revoke = vi.spyOn(URL, "revokeObjectURL");

    let seen = "";
    await instantiateWithVerifiedWasm(
      async (wasmObjectUrl) => {
        seen = wasmObjectUrl;
      },
      wasmModuleUrl("mvp"),
      WASM_SRI.mvp,
    );
    expect(seen.startsWith("blob:")).toBe(true);
    expect(revoke).toHaveBeenCalledWith(seen);

    revoke.mockClear();
    await expect(
      instantiateWithVerifiedWasm(
        async () => {
          throw new Error("instantiate failed");
        },
        wasmModuleUrl("eh"),
        WASM_SRI.eh,
      ),
    ).rejects.toThrow(/instantiate failed/);
    expect(revoke).toHaveBeenCalledTimes(1);
  });
});
