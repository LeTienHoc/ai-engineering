import { test } from "node:test";
import assert from "node:assert/strict";
import { checkTraceability, parseRules } from "../tools/lib/rules.ts";

const RULES = `# Rules

### FE-001 Server components by default
Source: https://nextjs.org/docs
Eval: case-a, case-b
Status: draft

### FE-002 No secrets in client
Source: https://owasp.org
Eval: case-b
Status: approved
`;

test("parseRules reads id, source, evals and status", () => {
  const rules = parseRules(RULES);
  assert.equal(rules.length, 2);
  assert.deepEqual(rules[0], {
    id: "FE-001",
    source: "https://nextjs.org/docs",
    eval: ["case-a", "case-b"],
    status: "draft",
  });
});

test("parseRules handles CRLF", () => {
  assert.equal(parseRules(RULES.replace(/\n/g, "\r\n"))[1].eval[0], "case-b");
});

test("fully traced rules return no issues", () => {
  assert.deepEqual(checkTraceability(parseRules(RULES), ["case-a", "case-b"]), []);
});

test("NO_SOURCE when a rule has no source", () => {
  const rules = parseRules("### FE-009 x\nEval: case-a\nStatus: draft\n");
  assert.ok(checkTraceability(rules, ["case-a"]).some((i) => i.code === "NO_SOURCE"));
});

test("NO_EVAL when a rule lists no eval", () => {
  const rules = parseRules("### FE-009 x\nSource: https://a.b\nStatus: draft\n");
  assert.ok(checkTraceability(rules, []).some((i) => i.code === "NO_EVAL"));
});

test("UNKNOWN_EVAL when eval id has no case", () => {
  const issues = checkTraceability(parseRules(RULES), ["case-a"]);
  assert.ok(issues.some((i) => i.code === "UNKNOWN_EVAL" && i.message.includes("case-b")));
});

test("DUPLICATE_ID when two rules share an id", () => {
  const dup = RULES + "\n### FE-001 again\nSource: https://a.b\nEval: case-a\nStatus: draft\n";
  assert.ok(checkTraceability(parseRules(dup), ["case-a", "case-b"]).some((i) => i.code === "DUPLICATE_ID"));
});
