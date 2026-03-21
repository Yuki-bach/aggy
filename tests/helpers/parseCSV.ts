/** Simple CSV parser for oracle tests — converts CSV string to row objects. */

export function parseCSVToRows(csv: string): Record<string, string | null>[] {
  const lines = csv.trimEnd().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string | null> = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = values[i] === "" ? null : values[i];
    }
    return row;
  });
}
