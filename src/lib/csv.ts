/** CSVファイルをテキストとして読み込む */
export function readFileAsText(file: File): Promise<string> {
  return file.text();
}
