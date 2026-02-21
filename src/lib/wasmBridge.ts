import type { AggResult } from "./aggregate";

type WasmStatus = "loading" | "ready" | "error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let vm: any = null;
let status: WasmStatus = "loading";
let initPromise: Promise<void> | null = null;

export function getWasmStatus(): WasmStatus {
  return status;
}

export function isReady(): boolean {
  return status === "ready";
}

function updateStatusUI(s: WasmStatus, label?: string): void {
  const dot = document.getElementById("wasm-dot");
  const lbl = document.getElementById("wasm-label");
  if (dot) dot.className = `status-dot ${s}`;
  if (lbl) lbl.textContent = label || s;
}

export async function initRubyVM(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      updateStatusUI("loading", "Ruby Wasm 読み込み中...");

      // @ts-expect-error — aliased in vite.config.ts
      const { DefaultRubyVM } = await import("@ruby/wasm-wasi/browser");

      // @ruby/3.3-wasm-wasi の .wasm バイナリを取得
      const response = await fetch(
        new URL(
          "../../node_modules/@ruby/3.3-wasm-wasi/dist/ruby+stdlib.wasm",
          import.meta.url
        )
      );
      const module = await WebAssembly.compileStreaming(response);
      const result = await DefaultRubyVM(module);
      vm = result.vm;

      // require json
      vm.eval(`require 'json'`);

      // aggregator.rb を読み込み
      const rbSource = await fetch("/src/ruby/aggregator.rb").then((r) =>
        r.text()
      );
      vm.eval(rbSource);

      status = "ready";
      updateStatusUI("ready", "Ruby Wasm Ready");
    } catch (err) {
      status = "error";
      updateStatusUI("error", `Wasm エラー: ${(err as Error).message}`);
      console.error("Ruby Wasm init error:", err);
      throw err;
    }
  })();

  return initPromise;
}

export function runRubyAggregation(payload: object): AggResult[] {
  if (!vm || status !== "ready") {
    throw new Error("Ruby VM is not ready");
  }

  const json = JSON.stringify(payload);
  // シングルクォート内のエスケープ処理
  const escaped = json
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");

  const result = vm.eval(
    `Aggregator.new(JSON.parse('${escaped}')).run.to_json`
  );
  return JSON.parse(result.toString());
}
