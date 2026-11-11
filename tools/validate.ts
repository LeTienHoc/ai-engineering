import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, type Issue } from "./lib/frontmatter.ts";
import { validateSkill } from "./lib/skill.ts";
import { validateEvalCase } from "./lib/evalcase.ts";
import { checkTraceability, parseRules } from "./lib/rules.ts";
import { scanSecrets } from "./lib/secrets.ts";

const root = resolve(fileURLToPath(import.meta.url), "..", "..");
const SKIP_DIRS = new Set([".git", "node_modules", ".superpowers"]);
const found: { file: string; issue: Issue }[] = [];

function report(file: string, issues: Issue[]) {
  for (const issue of issues) found.push({ file: relative(root, file), issue });
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const read = (f: string) => readFileSync(f, "utf8");
const all = walk(root);

// Eval cases
const caseIds: string[] = [];
for (const f of all.filter((f) => /evaluation[\\/]cases[\\/][^\\/]+\.md$/.test(f))) {
  const text = read(f);
  report(f, validateEvalCase(text));
  const id = parseFrontmatter(text)?.data.id;
  if (typeof id === "string") {
    if (caseIds.includes(id)) report(f, [{ code: "DUPLICATE_ID", message: `eval case id '${id}' is used more than once` }]);
    caseIds.push(id);
  }
}

// Skills and their rules
for (const f of all.filter((f) => /skills[\\/][^\\/]+[\\/]SKILL\.md$/.test(f))) report(f, validateSkill(read(f)));
for (const f of all.filter((f) => /skills[\\/][^\\/]+[\\/]references[\\/]rules\.md$/.test(f))) {
  report(f, checkTraceability(parseRules(read(f)), caseIds));
}

// Secret scan over text files (tests/ holds deliberate fake secrets as fixtures)
for (const f of all.filter((f) => /\.(md|json|ts)$/.test(f) && !relative(root, f).startsWith("tests"))) {
  report(f, scanSecrets(read(f)));
}

if (found.length === 0) {
  console.log("validate: OK");
} else {
  for (const { file, issue } of found) console.error(`${file}: [${issue.code}] ${issue.message}`);
  console.error(`validate: ${found.length} issue(s)`);
  process.exit(1);
}
