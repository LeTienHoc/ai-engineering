import { test } from "node:test";
import assert from "node:assert/strict";
import { formatEntry, parseLedger, validateEntry, type Entry } from "../tools/lib/ledger.ts";

const clean: Entry = {
  date: "2026-11-11",
  term: "Promise",
  agent: "tutor",
  topic: "Suspense",
  context: "Suspense works with data read using use with a Promise.",
  meaning: "A promise is a note saying a result will arrive later.",
};

test("accepts a clean entry", () => {
  assert.deepEqual(validateEntry(clean), []);
});

test("formatEntry then parseLedger round-trips quotes, backslash and newline", () => {
  const tricky: Entry = { ...clean, term: 'say "hi"\\ there\nnext' };
  const line = formatEntry(tricky);
  assert.equal(line.includes("\n"), false, "one entry must be exactly one line");
  const parsed = parseLedger(line + "\n");
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.entries[0], tricky);
});

test("parseLedger reports truncated and non-object lines with line numbers and keeps valid ones", () => {
  const text = [formatEntry(clean), '{"date":"2026-11-11","term":"Pro', "[1,2]", "", formatEntry({ ...clean, term: "lazy" })].join("\n");
  const parsed = parseLedger(text);
  assert.equal(parsed.entries.length, 2);
  assert.deepEqual(parsed.errors.map((e) => e.line), [2, 3]);
});

test("parseLedger handles CRLF and a BOM", () => {
  const text = "\uFEFF" + [formatEntry(clean), formatEntry({ ...clean, term: "lazy" })].join("\r\n") + "\r\n";
  const parsed = parseLedger(text);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.entries.length, 2);
});

test("parseLedger records a structurally valid JSON object that fails validation as an error", () => {
  const parsed = parseLedger(JSON.stringify({ ...clean, date: "yesterday" }));
  assert.equal(parsed.entries.length, 0);
  assert.equal(parsed.errors.length, 1);
});

test("rejects a Windows path, a drive letter and a Unix path as PRIVATE_DATA", () => {
  for (const context of ["see D:\\DuAn\\secret\\file.ts", "open C:/Users/me/x", "in /home/me/project/src/a.ts"]) {
    assert.ok(validateEntry({ ...clean, context }).some((i) => i.code === "PRIVATE_DATA"), context);
  }
});

test("rejects a secret-looking string as PRIVATE_DATA", () => {
  const fake = ["AKI", "A", "ABCDEFGHIJKLMNOP"].join("");
  assert.ok(validateEntry({ ...clean, context: `key ${fake}` }).some((i) => i.code === "PRIVATE_DATA"));
});

test("rejects a bad date and an empty term as BAD_FIELD", () => {
  assert.ok(validateEntry({ ...clean, date: "11/11/2026" }).some((i) => i.code === "BAD_FIELD"));
  assert.ok(validateEntry({ ...clean, term: "  " }).some((i) => i.code === "BAD_FIELD"));
});

test("rejects over-length fields as TOO_LONG", () => {
  assert.ok(validateEntry({ ...clean, context: "x".repeat(301) }).some((i) => i.code === "TOO_LONG"));
  assert.ok(validateEntry({ ...clean, term: "x".repeat(81) }).some((i) => i.code === "TOO_LONG"));
  assert.ok(validateEntry({ ...clean, meaning: "x".repeat(401) }).some((i) => i.code === "TOO_LONG"));
});
