import Papa from "papaparse";

export interface ParseResult {
  headers: string[];
  data: Record<string, string>[];
  rawText: string;
}

export async function parseCSVFile(file: File): Promise<ParseResult> {
  const rawText = await file.text();
  return new Promise((resolve, reject) => {
    Papa.parse(rawText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete(res) {
        if (res.errors.length && res.data.length === 0) {
          reject(new Error("CSVの読み込みに失敗しました"));
          return;
        }
        resolve({
          headers: res.meta.fields || [],
          data: res.data as Record<string, string>[],
          rawText,
        });
      },
      error(err: Error) {
        reject(new Error("CSVパースエラー: " + err.message));
      },
    });
  });
}
