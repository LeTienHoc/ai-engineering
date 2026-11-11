import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatEntry } from "../tools/lib/ledger.ts";

const setupScript = fileURLToPath(new URL("../tools/setup.ts", import.meta.url));
const reportScript = fileURLToPath(new URL("../tools/quality-report.ts", import.meta.url));
const repoRoot = fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]$/, "");

const run = (script: string, args: string[], env: Record<string, string> = {}) => {
  const r = spawnSync(process.execPath, [script, ...args], { env: { ...process.env, ...env }, encoding: "utf8" });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
};

test("setup writes config.json with this repo's path and nothing else; running twice is safe", () => {
  const home = mkdtempSync(join(tmpdir(), "qr-home-"));
  const first = run(setupScript, ["--home", home]);
  assert.equal(first.code, 0, first.out);
  const config = JSON.parse(readFileSync(join(home, "config.json"), "utf8"));
  assert.equal(config.repo, repoRoot.replace(/\\/g, "/"));
  assert.deepEqual(readdirSync(home), ["config.json"]);
  assert.equal(run(setupScript, ["--home", home]).code, 0);
});

function fixtureRepo(): string {
  const repo = mkdtempSync(join(tmpdir(), "qr-repo-"));
  mkdirSync(join(repo, "evaluation", "cases"), { recursive: true });
  mkdirSync(join(repo, "evaluation", "results"), { recursive: true });
  writeFileSync(join(repo, "evaluation", "cases", "case-a.md"), "x");
  writeFileSync(join(repo, "evaluation", "cases", "case-b.md"), "x");
  writeFileSync(join(repo, "evaluation", "results", "2026-11-11-case-a.md"), "case: case-a\nresult: PASS (owner judgment, informal)\n");
  writeFileSync(join(repo, "evaluation", "known-terms.md"), "- Promise | m | proposed\n");
  return repo;
}

test("the report CLI prints the sections, counts a corrupted ledger line, and never calls an unrun case a pass", () => {
  const home = mkdtempSync(join(tmpdir(), "qr-home-"));
  const repo = fixtureRepo();
  writeFileSync(join(home, "config.json"), JSON.stringify({ repo: repo.replace(/\\/g, "/") }));
  const good = { date: "2026-11-11", term: "Promise", agent: "tutor", topic: "t", context: "c", meaning: "m" };
  writeFileSync(join(home, "unknown-terms.jsonl"), [formatEntry(good), '{"date":"2026-11-11","te'].join("\n") + "\n");
  const r = run(reportScript, ["--home", home]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /Dữ liệu thiếu/);
  assert.match(r.out, /1 dòng/);
  assert.match(r.out, /tutor: 1/);
  assert.match(r.out, /case-a: đạt không chính thức/);
  assert.match(r.out, /case-b: chưa chạy/);
});

test("the report CLI says the ledger is missing instead of printing an all-clear", () => {
  const home = mkdtempSync(join(tmpdir(), "qr-home-"));
  const repo = fixtureRepo();
  const r = run(reportScript, ["--home", home, "--repo", repo]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /sổ từ lạ/i);
});

test("the report CLI exits 2 with a clear message when the repo cannot be determined", () => {
  const home = mkdtempSync(join(tmpdir(), "qr-home-"));
  const r = run(reportScript, ["--home", home]);
  assert.equal(r.code, 2);
  assert.match(r.out, /setup/);
  assert.equal(existsSync(join(home, "config.json")), false);
});
