import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { parseLedger } from "./lib/ledger.ts";
import { parseKnownTerms } from "./lib/knownterms.ts";
import { buildReport, parseResultFile, type CaseResult } from "./lib/report.ts";

const fail = (message: string): never => {
  console.error(message);
  process.exit(2);
};

function option(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i < 0) return undefined;
  const value = process.argv[i + 1];
  if (value === undefined || value.startsWith("--")) return fail(`Tùy chọn ${name} cần một giá trị (ví dụ ${name} <thư mục>).`);
  return value;
}

const home = resolve(option("--home") ?? process.env.AI_ENGINEERING_HOME ?? join(homedir(), ".claude", "ai-engineering"));

function findRepo(): string | undefined {
  const given = option("--repo");
  if (given) return resolve(given);
  const configFile = join(home, "config.json");
  if (!existsSync(configFile)) return undefined;
  try {
    const repo = JSON.parse(readFileSync(configFile, "utf8").replace(/^﻿/, "")).repo;
    if (typeof repo === "string" && repo) return resolve(repo);
  } catch {
    // fall through to the message below
  }
  return fail(`File ${configFile} không đọc được (hỏng hoặc sai định dạng). Chạy lại \`node tools/setup.ts\` trong repo nguồn.`);
}

const repo = findRepo();
if (!repo) {
  fail(`Không xác định được repo nguồn. Chạy \`node tools/setup.ts\` một lần trong repo nguồn (hoặc truyền --repo <thư mục>). Thư mục dữ liệu: ${home}`);
} else {
  const ledgerFile = join(home, "unknown-terms.jsonl");
  const ledgerFound = existsSync(ledgerFile) && statSync(ledgerFile).isFile();
  const ledger = ledgerFound ? parseLedger(readFileSync(ledgerFile, "utf8")) : { entries: [], errors: [] };

  const repoFound = existsSync(join(repo, "evaluation"));
  const listMd = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((n) => /\.md$/i.test(n)) : []);
  const caseIds = listMd(join(repo, "evaluation", "cases")).map((n) => n.replace(/\.md$/i, "")).sort();
  const results: CaseResult[] = [];
  let unreadableResults = 0;
  for (const name of listMd(join(repo, "evaluation", "results"))) {
    const parsed = parseResultFile(name, readFileSync(join(repo, "evaluation", "results", name), "utf8"));
    if (parsed) results.push(parsed);
    else unreadableResults++;
  }
  const knownFile = join(repo, "evaluation", "known-terms.md");
  const knownTerms = existsSync(knownFile) ? parseKnownTerms(readFileSync(knownFile, "utf8")).terms : [];

  console.log(
    buildReport({
      entries: ledger.entries,
      ledgerErrors: ledger.errors.length,
      ledgerPrivate: ledger.errors.filter((e) => e.codes.includes("PRIVATE_DATA")).length,
      ledgerFound,
      knownTerms,
      caseIds,
      results,
      unreadableResults,
      repoFound,
    }).text,
  );
}
