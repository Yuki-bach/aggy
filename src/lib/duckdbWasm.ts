/**
 * DuckDB Wasm loading helpers.
 *
 * Worker scripts are bundled by Vite as same-origin assets. The ~32 MiB
 * `.wasm` files stay on jsDelivr (Cloudflare Pages rejects files over 25 MiB)
 * and are checked with SHA-384 before DuckDB is instantiated.
 *
 * Hashes are for `@duckdb/duckdb-wasm@1.33.1-dev110.0` (DuckDB 2.0) and match
 * both `node_modules/@duckdb/duckdb-wasm/dist/` and
 * `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev110.0/dist/`.
 * The version is pinned exactly: semver orders `dev110` before `dev57`.
 */

export const DUCKDB_CDN = "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.33.1-dev110.0/dist";

export const WASM_SRI = {
  base: "sha384-CY+JULPCFW8kmuCHeKALt3Nzx0TrA7vBRVSMfQWC4kgexrMCOG6L7Xra190i4wWw",
  threads: "sha384-cAWt4WlGXTeXAWyDXccZyhzR8sCp53xv3va/nOjbhBLoxCibu7zo8SmiMtcODmce",
} as const;

export type WasmBundleKind = keyof typeof WASM_SRI;

export function wasmModuleUrl(kind: WasmBundleKind): string {
  return `${DUCKDB_CDN}/duckdb-${kind}.wasm`;
}

export function integrityForWasmUrl(url: string): string {
  for (const kind of Object.keys(WASM_SRI) as WasmBundleKind[]) {
    if (url === wasmModuleUrl(kind)) return WASM_SRI[kind];
  }
  throw new Error(`No SRI hash registered for DuckDB wasm: ${url}`);
}

/** Fetch a wasm module, enforce SRI, and return a `blob:` URL of the bytes. */
export async function fetchVerifiedWasmObjectUrl(url: string, integrity: string): Promise<string> {
  const response = await fetch(url, { integrity });
  if (!response.ok) {
    throw new Error(`DuckDB wasm fetch failed: ${response.status} ${response.statusText}`);
  }
  const wasmBlob = new Blob([await response.arrayBuffer()], { type: "application/wasm" });
  return URL.createObjectURL(wasmBlob);
}

/**
 * Instantiate DuckDB from an SRI-checked wasm blob.
 * The object URL is revoked after `instantiate` settles, success or failure.
 */
export async function instantiateWithVerifiedWasm(
  instantiate: (wasmObjectUrl: string) => Promise<unknown>,
  url: string,
  integrity: string,
): Promise<void> {
  const wasmObjectUrl = await fetchVerifiedWasmObjectUrl(url, integrity);
  try {
    await instantiate(wasmObjectUrl);
  } finally {
    URL.revokeObjectURL(wasmObjectUrl);
  }
}
