import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeTerm, parseKnownTerms } from "../tools/lib/knownterms.ts";

const GOOD = `# Từ đã biết

Giới thiệu.

- Promise | Một lời hứa sẽ có kết quả sau | proposed
- lazy | Chỉ tải khi cần dùng | confirmed
`;

test("parses well-formed lines and ignores headings and blank lines", () => {
  const r = parseKnownTerms(GOOD);
  assert.deepEqual(r.issues, []);
  assert.deepEqual(r.terms, [
    { term: "Promise", meaning: "Một lời hứa sẽ có kết quả sau", status: "proposed" },
    { term: "lazy", meaning: "Chỉ tải khi cần dùng", status: "confirmed" },
  ]);
});

test("DUPLICATE_TERM is case-insensitive", () => {
  const r = parseKnownTerms("- Promise | a | proposed\n- promise | b | proposed\n");
  assert.ok(r.issues.some((i) => i.code === "DUPLICATE_TERM"));
});

test("BAD_STATUS for an unknown status", () => {
  assert.ok(parseKnownTerms("- Promise | a | maybe\n").issues.some((i) => i.code === "BAD_STATUS"));
});

test("BAD_LINE for a bullet without three fields", () => {
  assert.ok(parseKnownTerms("- Promise | only two\n").issues.some((i) => i.code === "BAD_LINE"));
});

test("handles CRLF and an empty file", () => {
  assert.equal(parseKnownTerms(GOOD.replace(/\n/g, "\r\n")).terms.length, 2);
  assert.deepEqual(parseKnownTerms(""), { terms: [], issues: [] });
});

test("normalizeTerm trims, lowercases and collapses whitespace", () => {
  assert.equal(normalizeTerm("  Event   Handler "), "event handler");
});

const validateScript = fileURLToPath(new URL("../tools/validate.ts", import.meta.url));
test("validate.ts reports a duplicate term in evaluation/known-terms.md", () => {
  const root = mkdtempSync(join(tmpdir(), "validate-kt-"));
  mkdirSync(join(root, "evaluation"), { recursive: true });
  writeFileSync(join(root, "evaluation", "known-terms.md"), "- Promise | a | proposed\n- promise | b | proposed\n");
  const r = spawnSync(process.execPath, [validateScript], { env: { ...process.env, VALIDATE_ROOT: root }, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match((r.stdout ?? "") + (r.stderr ?? ""), /DUPLICATE_TERM/);
});
