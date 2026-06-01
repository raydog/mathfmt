import * as fs from "node:fs/promises";

/**
 * This script will attempt to locate the change log entry for a given version,
 * and write it to a known path. Used so that the changelog data can be the
 * source-of-truth for the github release notes.
 */
async function main() {
  const [version, outpath] = process.argv.slice(2);
  if (!version || !outpath) {
    throw new Error("Usage: ... <version> <path>");
  }

  const lines = (await fs.readFile("./CHANGELOG.md", "utf8")).split("\n");

  // Search for a line that is (a) a header, and (b) has the current version in
  // square brackets:
  const startIdx = lines.findIndex(
    (line) => /^\s*#+/.test(line) && line.includes(`[${version}]`),
  );

  if (startIdx < 0) {
    throw new Error(`Version ${version} not found`);
  }

  let [header, ...selection] = lines.slice(startIdx);
  header ??= "";

  // Continue searching until we find another header that is _at least_ as
  // indented as the one we found. Or end of file.
  const hashes = header.trim().match(/^#+/)!;

  const endIdx = selection.findIndex((line) =>
    line.trim().startsWith(hashes[0]),
  );

  if (endIdx >= 0) {
    selection = selection.slice(0, endIdx);
  }

  const text =
    selection
      .map((line) => line + "\n")
      .join("")
      .trim() + "\n";

  await fs.writeFile(outpath, text, "utf8");
}

main();
