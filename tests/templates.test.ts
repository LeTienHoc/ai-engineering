import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSkill } from "../tools/lib/skill.ts";
import { validateEvalCase } from "../tools/lib/evalcase.ts";
import { checkTraceability, parseRules } from "../tools/lib/rules.ts";

const load = (name: string) =>
  readFileSync(new URL(`../core/templates/${name}`, import.meta.url), "utf8").replace(/<[^>]+>/g, "x");

test("skill template, once filled, passes the skill contract", () => {
  assert.deepEqual(validateSkill(load("skill.template.md")), []);
});

test("eval-case template, once filled, passes the eval contract", () => {
  const filled = load("eval-case.template.md").replace("type: x", "type: success");
  assert.deepEqual(validateEvalCase(filled), []);
});

test("rule template, once filled, parses and traces", () => {
  const filled = load("rule.template.md").replace("### x x", "### FE-000 x").replace("Source: x", "Source: https://example.com/doc");
  const rules = parseRules(filled);
  assert.equal(rules.length, 1);
  assert.deepEqual(checkTraceability(rules, ["x"]), []);
});

test("agent template, once filled, passes the agent contract", async () => {
  const { validateAgent } = await import("../tools/lib/agent.ts");
  const filled = load("agent.template.md").replace("name: x", "name: demo").replace("model: x", "model: haiku");
  assert.deepEqual(validateAgent(filled, "demo"), []);
});
