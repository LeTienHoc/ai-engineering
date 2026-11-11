import { test } from "node:test";
import assert from "node:assert/strict";
import { buildReport, parseResultFile, type ReportInput } from "../tools/lib/report.ts";
import type { Entry } from "../tools/lib/ledger.ts";

const entry = (over: Partial<Entry> = {}): Entry => ({
  date: "2026-11-11",
  term: "Promise",
  agent: "tutor",
  topic: "Suspense",
  context: "ctx",
  meaning: "m",
  ...over,
});

const base = (over: Partial<ReportInput> = {}): ReportInput => ({
  entries: [],
  ledgerErrors: 0,
  ledgerFound: true,
  knownTerms: [{ term: "Promise", meaning: "m", status: "proposed" }],
  caseIds: ["case-a", "case-b"],
  results: [],
  repoFound: true,
  ...over,
});

const joined = (r: ReturnType<typeof buildReport>, key: string) => (r.sections[key] ?? []).join("\n");

test("unknown-agent entries are counted separately and not ranked", () => {
  const r = buildReport(base({ entries: [entry(), entry({ agent: "unknown" }), entry({ agent: "unknown", term: "lazy" })] }));
  assert.match(joined(r, "Không rõ nguồn"), /2/);
  assert.doesNotMatch(joined(r, "Agent gây khó hiểu"), /unknown/);
  assert.match(joined(r, "Agent gây khó hiểu"), /tutor: 1/);
});

test("the same term in different letter case aggregates as one repeated term", () => {
  const r = buildReport(base({ entries: [entry({ term: "Promise" }), entry({ term: "promise" }), entry({ term: "lazy" })] }));
  assert.match(joined(r, "Từ lặp lại"), /promise: 2/i);
  assert.doesNotMatch(joined(r, "Từ lặp lại"), /lazy/);
});

test("terms in the ledger but not in the regression list are suggested", () => {
  const r = buildReport(base({ entries: [entry({ term: "hydration" }), entry({ term: "PROMISE" })] }));
  assert.match(joined(r, "Từ chưa có trong danh sách hồi quy"), /hydration/);
  assert.doesNotMatch(joined(r, "Từ chưa có trong danh sách hồi quy"), /promise/i);
});

test("a case with no result is 'chưa chạy' and never counted as a pass", () => {
  const r = buildReport(base());
  const text = joined(r, "Eval case");
  assert.match(text, /case-a: chưa chạy/);
  assert.match(text, /case-b: chưa chạy/);
  assert.doesNotMatch(text, /đạt/);
});

test("an informal PASS is reported as informal, a formal PASS and a FAIL are distinct", () => {
  const r = buildReport(
    base({
      caseIds: ["case-a", "case-b", "case-c"],
      results: [
        { caseId: "case-a", date: "2026-11-11", result: "PASS (owner judgment, informal)" },
        { caseId: "case-b", date: "2026-11-11", result: "PASS" },
        { caseId: "case-c", date: "2026-11-11", result: "FAIL" },
      ],
    }),
  );
  const text = joined(r, "Eval case");
  assert.match(text, /case-a: đạt không chính thức/);
  assert.match(text, /case-b: đạt chính thức/);
  assert.match(text, /case-c: RỚT/);
});

test("the latest result for a case wins", () => {
  const r = buildReport(
    base({
      caseIds: ["case-a"],
      results: [
        { caseId: "case-a", date: "2026-11-12", result: "PASS" },
        { caseId: "case-a", date: "2026-11-10", result: "FAIL" },
      ],
    }),
  );
  assert.match(joined(r, "Eval case"), /case-a: đạt chính thức/);
});

test("missing ledger, empty results and empty known-terms are stated as missing data", () => {
  const r = buildReport(base({ ledgerFound: false, knownTerms: [], results: [] }));
  const missing = joined(r, "Dữ liệu thiếu");
  assert.match(missing, /sổ từ lạ/i);
  assert.match(missing, /chưa có kết quả eval/i);
  assert.match(missing, /no-unexplained-known-terms.*chưa chạy được/i);
});

test("an empty ledger and ledger errors are reported", () => {
  const empty = buildReport(base({ entries: [] }));
  assert.match(joined(empty, "Dữ liệu thiếu"), /trống/);
  const errs = buildReport(base({ entries: [entry()], ledgerErrors: 2 }));
  assert.match(joined(errs, "Dữ liệu thiếu"), /2 dòng/);
});

test("a missing repo is stated and no case is listed as passed", () => {
  const r = buildReport(base({ repoFound: false, caseIds: [] }));
  assert.match(joined(r, "Dữ liệu thiếu"), /repo nguồn/i);
});

test("parseResultFile reads date, case id and result from the file name and result line", () => {
  assert.deepEqual(parseResultFile("2026-11-11-beginner-plain-language.md", "case: x\nresult: PASS (owner judgment, informal)\n"), {
    caseId: "beginner-plain-language",
    date: "2026-11-11",
    result: "PASS (owner judgment, informal)",
  });
  assert.equal(parseResultFile("README.md", "result: PASS"), null);
  assert.equal(parseResultFile("2026-11-11-x.md", "no result line"), null);
  assert.equal(parseResultFile("2026-11-11-x.md", "result: PASS\r\n")?.result, "PASS");
});
