import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));
const example = fileURLToPath(new URL("../examples/code-optimizer", import.meta.url));

test("sample code-optimizer project passes the validator", () => {
  assert.ok(existsSync(`${example}/.claude/agents/code-optimizer.md`), "sample agent file is missing");
  const r = spawnSync(process.execPath, [`${repo}/tools/validate.ts`], {
    env: { ...process.env, VALIDATE_ROOT: example },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, (r.stdout ?? "") + (r.stderr ?? ""));
});

test("sample code-optimizer is read-only and cannot spawn agents", () => {
  const text = readFileSync(`${example}/.claude/agents/code-optimizer.md`, "utf8");
  const tools = /^tools:\s*(.*)$/m.exec(text)?.[1].split(",").map((t) => t.trim()) ?? [];
  assert.deepEqual(tools, ["Read", "Grep", "Glob"]);
});
