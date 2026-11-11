export type Issue = { code: string; message: string };

export type Frontmatter = {
  data: Record<string, string | string[]>;
  body: string;
};

/** Parse simple `key: value` YAML frontmatter. Returns null when absent/malformed. */
export function parseFrontmatter(text: string): Frontmatter | null {
  const normalized = text.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  if (!match) return null;
  const data: Record<string, string | string[]> = {};
  for (const line of match[1].split("\n")) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const value = kv[2].trim();
    data[kv[1]] = value.includes(",") && kv[1] === "rules" ? value.split(",").map((v) => v.trim()).filter(Boolean) : value;
  }
  return { data, body: match[2] };
}

/** Level-2 heading titles in a markdown body. */
export function headings(body: string): string[] {
  return [...body.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);
}
