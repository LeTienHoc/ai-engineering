import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatEntry, parseLedger, validateEntry, type Entry } from "../tools/lib/ledger.ts";
import { normalizeTerm } from "../tools/lib/knownterms.ts";
import { buildReport, parseResultFile, type ReportInput } from "../tools/lib/report.ts";

const clean: Entry = { date: "2026-11-11", term: "Promise", agent: "tutor", topic: "Suspense", context: "ctx", meaning: "m" };
const privateCodes = (e: Entry) => validateEntry(e).filter((i) => i.code === "PRIVATE_DATA");

// --- I1: wider private-data detection, applied to every free-text field ------------------------
test("private paths and credentials in many forms are rejected", () => {
  const bad = [
    "Xem ~/work/acme-portal/src/order.ts",
    "mở ../acme/src/index.ts",
    "file src/OrderSyncService.ts",
    "\"/Users/bob/x\"",
    "(/Users/bob/x)",
    "dùng $HOME/x",
    "dùng %USERPROFILE%\\x",
    "kết nối postgres://user:pw@db.internal:5432/x",
    "UNC \\\\server\\share\\file",
  ];
  for (const context of bad) assert.ok(privateCodes({ ...clean, context }).length > 0, `should reject: ${context}`);
  for (const field of ["term", "topic", "meaning", "agent"] as const) {
    assert.ok(privateCodes({ ...clean, [field]: "C:\\Users\\bob\\acme" }).length > 0, `${field} must be checked`);
  }
});

test("ordinary public text is accepted", () => {
  const ok = [
    "react.dev/reference/react/Suspense",
    "https://react.dev/reference/react/Suspense",
    "client/server và/hoặc browser",
    "a code escape like a\\n b is fine",
    "Suspense works with lazy-loaded code and data read with use.",
  ];
  for (const context of ok) assert.deepEqual(validateEntry({ ...clean, context }), [], `should accept: ${context}`);
});

// --- M5: field limits, real dates, no quadratic scan --------------------------------------------
test("topic and agent have length limits, the date must be real, and long input is rejected quickly", () => {
  assert.ok(validateEntry({ ...clean, topic: "x".repeat(81) }).some((i) => i.code === "TOO_LONG"));
  assert.ok(validateEntry({ ...clean, agent: "x".repeat(81) }).some((i) => i.code === "TOO_LONG"));
  assert.ok(validateEntry({ ...clean, date: "2026-13-45" }).some((i) => i.code === "BAD_FIELD"));
  const start = Date.now();
  validateEntry({ ...clean, topic: "a".repeat(200_000) });
  assert.ok(Date.now() - start < 500, "a huge field must be rejected without a slow scan");
});

// --- parseLedger exposes the codes so the report can separate private data -----------------------
test("parseLedger errors carry their issue codes", () => {
  const text = [formatEntry({ ...clean, context: "Xem ~/work/x/y.ts" }), '{"bad'].join("\n");
  const { errors } = parseLedger(text);
  assert.deepEqual(errors.map((e) => e.codes.includes("PRIVATE_DATA")), [true, false]);
});

// --- M1/M2: normalization -----------------------------------------------------------------------
test("normalizeTerm folds Unicode forms and zero-width characters", () => {
  assert.equal(normalizeTerm("Hiệu ứng".normalize("NFD")), normalizeTerm("Hiệu ứng".normalize("NFC")));
  assert.equal(normalizeTerm("Pro\u200Bmise"), "promise");
});

const base = (over: Partial<ReportInput> = {}): ReportInput => ({
  entries: [],
  ledgerErrors: 0,
  ledgerFound: true,
  knownTerms: [{ term: "Promise", meaning: "m", status: "proposed" }],
  caseIds: ["case-a"],
  results: [],
  repoFound: true,
  ...over,
});
const text = (r: ReturnType<typeof buildReport>, key: string) => (r.sections[key] ?? []).join("\n");

test("agent names are normalized and Unknown counts as unknown, not as an agent", () => {
  const r = buildReport(base({ entries: [{ ...clean, agent: "Tutor" }, { ...clean, agent: "tutor" }, { ...clean, agent: "Unknown" }] }));
  assert.match(text(r, "Agent gây khó hiểu"), /tutor: 2/);
  assert.doesNotMatch(text(r, "Agent gây khó hiểu"), /unknown/i);
  assert.match(text(r, "Không rõ nguồn"), /1/);
});

// --- I4: only an exact PASS is a formal pass ------------------------------------------------------
test("a PASS with any qualifier, in Vietnamese or English, is informal", () => {
  for (const result of ["PASS (không chính thức)", "PASS (owner judgment)", "PASS - informal", "Pass but not graded"]) {
    const r = buildReport(base({ results: [{ caseId: "case-a", date: "2026-11-11", result }] }));
    assert.match(text(r, "Eval case"), /case-a: đạt không chính thức/, result);
  }
  const formal = buildReport(base({ results: [{ caseId: "case-a", date: "2026-11-11", result: "pass " }] }));
  assert.match(text(formal, "Eval case"), /case-a: đạt chính thức/);
});

test("result lines written with another letter case or markdown bold are still read", () => {
  assert.equal(parseResultFile("2026-11-11-x.md", "Result: PASS")?.result, "PASS");
  assert.equal(parseResultFile("2026-11-11-x.md", "**result:** FAIL")?.result, "FAIL");
  assert.equal(parseResultFile("2026-11-11-x.MD", "result: PASS")?.caseId, "x");
});

// --- M3/M4: honest data-missing messages ------------------------------------------------------------
test("private-data lines, unreadable results and an all-invalid ledger are named in the missing-data section", () => {
  const r = buildReport(base({ entries: [], ledgerErrors: 3, ledgerPrivate: 2, unreadableResults: 4 }));
  const missing = text(r, "Dữ liệu thiếu");
  assert.match(missing, /2 dòng.*dữ liệu riêng/);
  assert.match(missing, /1 dòng.*lỗi/);
  assert.match(missing, /4 file kết quả.*không đọc được/);
  assert.doesNotMatch(missing, /đang trống/, "a ledger whose every line is invalid is not 'empty'");
});

// --- CLI hardening -------------------------------------------------------------------------------------
const run = (script: string, args: string[], env: Record<string, string> = {}) => {
  const r = spawnSync(process.execPath, [fileURLToPath(new URL(`../tools/${script}`, import.meta.url)), ...args], {
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
};
function fixture(): { home: string; repo: string } {
  const home = mkdtempSync(join(tmpdir(), "rf-home-"));
  const repo = mkdtempSync(join(tmpdir(), "rf-repo-"));
  mkdirSync(join(repo, "evaluation", "cases"), { recursive: true });
  mkdirSync(join(repo, "evaluation", "results"), { recursive: true });
  writeFileSync(join(repo, "evaluation", "cases", "case-a.md"), "x");
  return { home, repo };
}

test("report CLI reads a config.json that has a BOM and explains an unreadable config", () => {
  const { home, repo } = fixture();
  writeFileSync(join(home, "config.json"), "\uFEFF" + JSON.stringify({ repo: repo.replace(/\\/g, "/") }));
  assert.equal(run("quality-report.ts", ["--home", home]).code, 0);
  writeFileSync(join(home, "config.json"), "{not json");
  const bad = run("quality-report.ts", ["--home", home]);
  assert.equal(bad.code, 2);
  assert.match(bad.out, /config\.json.*(không đọc được|hỏng)/);
});

test("report CLI rejects a flag with no value and survives a directory in place of the ledger", () => {
  const { home, repo } = fixture();
  const noValue = run("quality-report.ts", ["--home"]);
  assert.equal(noValue.code, 2);
  assert.match(noValue.out, /--home/);
  mkdirSync(join(home, "unknown-terms.jsonl"));
  const r = run("quality-report.ts", ["--home", home, "--repo", repo]);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /sổ từ lạ/i);
});

test("report CLI counts result files it cannot read", () => {
  const { home, repo } = fixture();
  writeFileSync(join(repo, "evaluation", "results", "2026-11-11-case-a-run2.md"), "no result line here");
  writeFileSync(join(repo, "evaluation", "results", "notes.md"), "result: PASS");
  const r = run("quality-report.ts", ["--home", home, "--repo", repo]);
  assert.match(r.out, /2 file kết quả.*không đọc được/);
  assert.match(r.out, /case-a: chưa chạy/);
});

test("setup refuses the plugin cache folder and reports when it replaces a different repo path", () => {
  const home = mkdtempSync(join(tmpdir(), "rf-setup-"));
  writeFileSync(join(home, "config.json"), JSON.stringify({ repo: "D:/Other/repo" }));
  const changed = run("setup.ts", ["--home", home]);
  assert.equal(changed.code, 0, changed.out);
  assert.match(changed.out, /D:\/Other\/repo/);
  const cache = mkdtempSync(join(tmpdir(), "rf-cache-"));
  const script = join(cache, ".claude", "plugins", "cache", "m", "p", "1.0.0", "tools");
  mkdirSync(script, { recursive: true });
  writeFileSync(join(script, "setup.ts"), readFileSync(fileURLToPath(new URL("../tools/setup.ts", import.meta.url)), "utf8"));
  const r = spawnSync(process.execPath, [join(script, "setup.ts"), "--home", home], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match((r.stdout ?? "") + (r.stderr ?? ""), /cache/);
});

// --- skills: quoted, bare-capable command, no folder clause ---------------------------------------------
const read = (p: string) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), "utf8");
test("quality-report pre-approves its quoted script command, with and without arguments", () => {
  const allowed = /^allowed-tools:\s*(.*)$/m.exec(read("skills/quality-report/SKILL.md"))?.[1].trim();
  assert.equal(
    allowed,
    'Bash(node "${CLAUDE_PLUGIN_ROOT}/tools/quality-report.ts") Bash(node "${CLAUDE_PLUGIN_ROOT}/tools/quality-report.ts" *)',
  );
  assert.match(read("skills/quality-report/SKILL.md"), /node "\$\{CLAUDE_PLUGIN_ROOT\}\/tools\/quality-report\.ts"/);
});

test("term-feedback writes only the one ledger path and avoids duplicates and over-long rewrites", () => {
  const skill = read("skills/term-feedback/SKILL.md");
  assert.doesNotMatch(skill, /different ledger folder/i, "the injectable folder clause is removed");
  assert.match(skill, /line count/i);
  assert.match(skill, /already recorded in this session/i);
  assert.match(skill, /1500 lines/);
});

test("policy no longer claims an unconditional owner approval of the ledger exception", () => {
  assert.match(read("governance/policy.md"), /chờ xác nhận|sẽ được xác nhận/);
});
