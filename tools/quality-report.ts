import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { parseLedger } from "./lib/ledger.ts";
import { parseKnownTerms } from "./lib/knownterms.ts";
import { buildReport, parseResultFile, type CaseResult } from "./lib/report.ts";

function option(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const home = resolve(option("--home") ?? process.env.AI_ENGINEERING_HOME ?? join(homedir(), ".claude", "ai-engineering"));

function findRepo(): string | undefined {
  const given = option("--repo");
  if (given) return resolve(given);
  const configFile = join(home, "config.json");
  if (!existsSync(configFile)) return undefined;
  try {
    const repo = JSON.parse(readFileSync(configFile, "utf8")).repo;
    return typeof repo === "string" && repo ? resolve(repo) : undefined;
  } catch {
    return undefined;
  }
}

const repo = findRepo();
if (!repo) {
  console.error(`Không xác định được repo nguồn. Chạy \`node tools/setup.ts\` một lần trong repo nguồn (hoặc truyền --repo <thư mục>). Thư mục dữ liệu: ${home}`);
  process.exit(2);
}

const ledgerFile = join(home, "unknown-terms.jsonl");
const ledgerFound = existsSync(ledgerFile);
const ledger = ledgerFound ? parseLedger(readFileSync(ledgerFile, "utf8")) : { entries: [], errors: [] };

const repoFound = existsSync(join(repo, "evaluation"));
const listMd = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((n) => n.endsWith(".md")) : []);
const caseIds = listMd(join(repo, "evaluation", "cases")).map((n) => n.replace(/\.md$/, "")).sort();
const results: CaseResult[] = [];
for (const name of listMd(join(repo, "evaluation", "results"))) {
  const parsed = parseResultFile(name, readFileSync(join(repo, "evaluation", "results", name), "utf8"));
  if (parsed) results.push(parsed);
}
const knownFile = join(repo, "evaluation", "known-terms.md");
const knownTerms = existsSync(knownFile) ? parseKnownTerms(readFileSync(knownFile, "utf8")).terms : [];

console.log(
  buildReport({ entries: ledger.entries, ledgerErrors: ledger.errors.length, ledgerFound, knownTerms, caseIds, results, repoFound }).text,
);
