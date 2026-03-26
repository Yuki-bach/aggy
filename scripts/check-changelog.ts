import { readFileSync } from "node:fs";

interface PkgJson {
  version: string;
}
interface ChangelogEntry {
  version: string;
}

const pkg: PkgJson = JSON.parse(readFileSync("package.json", "utf8"));
const changelog: ChangelogEntry[] = JSON.parse(readFileSync("src/lib/changelog.json", "utf8"));

const versions = changelog.map((e) => e.version);

if (!versions.includes(pkg.version)) {
  console.error(`\x1b[31mError: changelog.json has no entry for v${pkg.version}\x1b[0m`);
  console.error(`  Found versions: ${versions.join(", ")}`);
  console.error(`  Add an entry to src/lib/changelog.json before releasing.`);
  process.exit(1);
}
