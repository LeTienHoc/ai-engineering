# Brain v2 – verify-pair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a skill `verify-pair` to the `ai-engineering` plugin that runs a worker subagent (proposal-only) or takes an existing output, proposes check-only commands taken from the project, runs only the owner-approved ones, hands the real output to `output-critic`, and reports a ✅/❌/⚠ table; ship `output-critic` inside the plugin; release 0.5.0.

**Architecture:** The orchestration is a Markdown skill run in the main session (subagents cannot spawn subagents). Two deterministic helpers back its two hard safety checks: `tools/check-agent.ts` (is a worker agent proposal-only?) and `tools/check-script.ts` (is a `package.json` script, with its hooks and nested `npm run` calls, check-only?). `output-critic` moves to the plugin layout (`agents/` + `agent-kit/` at the plugin root), and `tools/validate.ts` learns to validate that layout in full mode.

**Tech Stack:** Markdown + frontmatter, TypeScript run directly by Node (erasable syntax only), `node:test`, git. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-18-verify-pair-design.md` (owner approved 2026-11-18)

## Global Constraints

- Mode (a) worker = subagent only; it must be proposal-only: its `tools` must not contain `Edit`, `Write`, `NotebookEdit`, `Bash`, `PowerShell`, and must be declared (missing `tools` = all tools = not allowed) (spec §5.1 step 1, VP-007).
- Commands proposed are check-only and come from the project. Forbidden: install/uninstall, delete, push, editing files, `--fix`, snapshot update (`-u`), migrate, deploy, network commands (spec §5.1 step 4, VP-002).
- Script bodies and their `pre<x>`/`post<x>` hooks are read before proposing `npm run <x>`; build is allowed only with "lệnh này ghi file vào `<thư mục build>`" in its approval line (spec §5.1 step 4).
- The owner approves the whole command list once; only approved commands run; none added (VP-003).
- `✅ đã kiểm` only with real command output supporting it; `❌ sai` only with real output contradicting it; everything else `⚠ chưa kiểm` (including 0 tests run). The critic can only downgrade, never upgrade (spec §5.2, VP-004).
- At most 10 claims per run (spec §5.1 step 3).
- `output-critic` stays `tools: Read, Grep, Glob`; its OC-001..OC-006 stay approved and its output format (OC-005) is unchanged (spec §3, §5.2).
- Report format is fixed as in spec §5.2, ending with "Quyết định là của anh."
- Docs for the owner in Vietnamese, identifiers in English; no new libraries; `node --test tests/` and `node tools/validate.ts` clean before every commit. Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- New rules `VP-*` start `Status: draft`. Version 0.5.0.
- Work on branch `feat/verify-pair` from `main`.

## Review Focus

- `package.json` missing, not valid JSON, or the script name absent: `check-script` reports BLOCKED with a reason and exit 1, never a crash (Task 1 test).
- A script that only calls another script (`"check": "npm run lint && npm run test"`) where the nested one has `--fix`: the nested body is checked too, with cycle protection (Task 1 test).
- Windows-style and wrapper write commands (`del`, `rimraf`, `rd /s`, `cross-env X=1 eslint --fix`): BLOCKED (Task 1 test).
- An agent file whose `tools` is a YAML list or has extra spaces/case (`tools: read, grep`): parsed the same as the comma form; unknown tools are not silently "safe" (Task 1 test).
- After the move, an old copy left in `.claude/agents/output-critic.md` would make two critics: the repo must have exactly one (Task 3 test).

---

### Task 1: Safety helpers (`check-agent`, `check-script`)

**Files:**
- Create: `tools/lib/verifycheck.ts`, `tools/check-agent.ts`, `tools/check-script.ts`
- Test: `tests/verifycheck.test.ts`

**Interfaces:**
- Produces:
  - `export type CheckResult = { ok: boolean; reason: string; checked: string[] }` (`checked` = script names or tool names examined, in order).
  - `export const WRITE_TOOLS = ["Edit", "Write", "NotebookEdit", "Bash", "PowerShell"]`
  - `export function checkAgentProposalOnly(agentText: string): CheckResult`
  - `export function checkScript(packageJsonText: string, scriptName: string): CheckResult`
  - CLI `node tools/check-agent.ts <agent.md>` and `node tools/check-script.ts <package.json> <script>`: print `OK: <reason>` (exit 0) or `BLOCKED: <reason>` (exit 1); wrong arguments or unreadable file → `usage: ...` / `BLOCKED: cannot read <path>` with exit 2 / 1 respectively.

- [ ] **Step 1: Write failing tests** in `tests/verifycheck.test.ts`:
  - `checkAgentProposalOnly`: `tools: Read, Grep, Glob` → ok; `tools: Read, Write` → not ok, reason names `Write`; no `tools` line → not ok, reason contains `no tools`; `tools: [Read, Bash]` (YAML list) → not ok naming `Bash`; `tools: read, grep` → ok (case-insensitive match against WRITE_TOOLS); `tools: Read, Grep, Agent` → not ok naming `Agent` (a worker must not spawn agents); CRLF file gives the same result as LF.
  - `checkScript`: `{"scripts":{"test":"vitest run"}}`, `test` → ok, `checked` = `["test"]`; `lint: "eslint . --fix"` → not ok, reason contains `--fix`; `test: "jest -u"` → not ok (`-u`); `pretest: "rimraf dist"` with `test: "jest"` → not ok, `checked` includes `pretest`; `check: "npm run lint && npm run test"` with `lint: "eslint --fix ."` → not ok naming `lint`; `a: "npm run b"`, `b: "npm run a"` → returns (no infinite loop), ok unless a body matches; `cross-env CI=1 eslint --fix` → not ok; `del /q out` and `rd /s x` → not ok; `prisma migrate dev` → not ok; `npm install` → not ok; `git push` → not ok; script absent → not ok, reason contains `not found`; invalid JSON → not ok, reason contains `package.json`.
  - CLI: `check-script` on a temp `package.json` prints `OK:` exit 0 / `BLOCKED:` exit 1; `check-agent` with no argument exits 2.
- [ ] **Step 2:** Run `node --test tests/verifycheck.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `tools/lib/verifycheck.ts`. Agent: parse frontmatter with the existing `parseFrontmatter` from `tools/lib/frontmatter.ts` if it accepts lists, otherwise a local regex for `tools:` line or `[...]`; forbidden = WRITE_TOOLS + `Agent`. Script: one forbidden-pattern list (word-boundary regexes) for `--fix`, `-u`/`--updateSnapshot`, `rm`, `rimraf`, `del`, `rd`, `rmdir`, `install`/`i`/`add`/`uninstall`/`remove` after `npm|yarn|pnpm`, `migrate`, `deploy`, `push`, `publish`, `curl`, `wget`, output redirection `>`; follow `pre<x>`, `post<x>` and nested `npm run <y>`/`yarn <y>`/`pnpm <y>`/`pnpm run <y>`, depth ≤ 5, visited set. The two CLIs are thin wrappers.
- [ ] **Step 4:** Run `node --test tests/` and `node tools/validate.ts`. Expected: all pass, `validate: OK`.
- [ ] **Step 5: Commit** `feat: check-agent and check-script safety helpers for verify-pair`.

### Task 2: Validator checks plugin-layout agents

**Files:**
- Modify: `tools/validate.ts` (the "Generated agents" block)
- Test: `tests/agentkit.test.ts`

**Interfaces:**
- Consumes: existing `validateAgent`, `validateAgentKit`, `parseRules`, `checkTraceability`, `checkCases`.
- Produces: in full mode (no `--agents`), agents are validated under **both** `<root>/.claude/` (project layout) and `<root>/` (plugin layout: `agents/<name>.md` + `agent-kit/<name>/`), each in its own id namespace. `--agents` behaviour unchanged.

- [ ] **Step 1: Write failing tests** (reuse the `project()` and `agentFiles()` helpers; `strip()` turns `.claude/...` into root paths):
  - `plugin layout agent is validated in full mode`: `strip(agentFiles("opt"))` with body of 125 lines → status 1, output matches `BODY_TOO_LONG`.
  - `valid plugin layout agent passes in full mode`: `strip(agentFiles("opt"))` → status 0.
  - `plugin layout kit without agent is KIT_WITHOUT_AGENT`.
  - `project and plugin layouts are separate namespaces`: `.claude` agent `a` and root agent `b` sharing case ids → status 0.
- [ ] **Step 2:** Run `node --test tests/agentkit.test.ts`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement**: move the block into `function checkAgents(base: string, requireAny: boolean): void`; full mode calls `checkAgents(join(root, ".claude"), false)` and `checkAgents(root, false)`; `--agents` mode calls it once with the existing `agentBase` and `requireAny = true`. Messages that say `.claude/agents/` say `agents/` when `base === root`.
- [ ] **Step 4:** Run `node --test tests/` and `node tools/validate.ts`. Expected: all pass, `validate: OK`.
- [ ] **Step 5: Commit** `feat: validator checks agents in the plugin layout`.

### Task 3: Move `output-critic` into the plugin

**Files:**
- Move: `.claude/agents/output-critic.md` → `agents/output-critic.md`; `.claude/agent-kit/output-critic/` → `agent-kit/output-critic/` (use `git mv`)
- Modify: `agents/output-critic.md` (body), `agent-kit/output-critic/rules.md` (intro line only)
- Test: `tests/critic.test.ts`

**Interfaces:**
- Produces: plugin agent `output-critic` at `agents/output-critic.md`, `tools: Read, Grep, Glob`, `model: sonnet`; the body no longer depends on any path to its rules.

- [ ] **Step 1: Write failing tests** in `tests/critic.test.ts`: `agents/output-critic.md` exists and `.claude/agents/output-critic.md` does not; frontmatter `tools` equals `Read, Grep, Glob`; body does not contain `.claude/agent-kit`; body mentions each of `OC-001` … `OC-006`; `checkAgentProposalOnly` (Task 1) returns ok for it; `agent-kit/output-critic/rules.md` still has 6 rules all `Status: approved`.
- [ ] **Step 2:** Run `node --test tests/critic.test.ts`. Expected: FAIL.
- [ ] **Step 3: Move and edit.** Replace the "Rules: `.claude/agent-kit/...`" line with a short "## Rules" section that states OC-001..OC-006 in one line each (same meaning as `agent-kit/output-critic/rules.md`; that file stays the source for eval traceability). Body stays ≤ 120 lines, `description` unchanged. In `rules.md` intro, note the agent now ships in the plugin. Do not change rule text or status.
- [ ] **Step 4:** Run `node --test tests/` and `node tools/validate.ts`. Expected: all pass, `validate: OK`.
- [ ] **Step 5: Commit** `refactor: ship output-critic inside the plugin`.

### Task 4: `verify-pair` skill, rules and eval cases

**Files:**
- Create: `skills/verify-pair/SKILL.md`, `skills/verify-pair/references/rules.md`, `evaluation/cases/vp-*.md` (10 files, names below)
- Test: `tests/repo.test.ts` (add tests)

**Interfaces:**
- Consumes: `node "${CLAUDE_PLUGIN_ROOT}/tools/check-agent.ts" <agent.md>`, `node "${CLAUDE_PLUGIN_ROOT}/tools/check-script.ts" <package.json> <script>` (Task 1); plugin agent `output-critic` (Task 3).
- Produces: skill `verify-pair` (`/ai-engineering:verify-pair`).

- [ ] **Step 1: Write failing tests** in `tests/repo.test.ts`:
  - `verify-pair pre-approves only its two check scripts`: frontmatter `allowed-tools` contains exactly the `check-agent.ts` and `check-script.ts` patterns (with and without ` *`), nothing else; `disallowed-tools` contains `Write`, `Edit`, `NotebookEdit`.
  - `verify-pair fixes the report format`: SKILL.md contains `✅ đã kiểm`, `❌ sai`, `⚠ chưa kiểm`, `Kết luận critic:`, `Quyết định là của anh.`, `output-critic`, `check-agent.ts`, `check-script.ts`.
  - `every verify-pair rule has at least one vp-* eval case`: 7 blocks `VP-001`..`VP-007`, each `Eval:` lists a `vp-` case.
- [ ] **Step 2:** Run `node --test tests/repo.test.ts`. Expected: new tests FAIL.
- [ ] **Step 3: Write `skills/verify-pair/SKILL.md`** with the contract sections (Role, Objective, Inputs, Outputs, Constraints, Workflow, Ask When Missing, Approval Required, Verify, Report) following spec §5.1 steps 1–8 and §5.2 verbatim for the format and status rules. Workflow must say: run `check-agent.ts` on the worker's file before mode (a) and stop on `BLOCKED`; run `check-script.ts` before proposing any `npm|yarn|pnpm run` script and drop it on `BLOCKED` with the reason; show the numbered approval list `[n] khẳng định → lệnh → vì sao`; run only approved commands; give `output-critic` the request, the output, the claims and the evidence; apply critic downgrades only.
- [ ] **Step 4: Write `skills/verify-pair/references/rules.md`** with VP-001..VP-007 exactly as spec §5.4 (Source as given there, `Status: draft`) and `Eval:` lines matching the cases below.
- [ ] **Step 5: Write the 10 eval cases** (frontmatter `id`, `type`, `rules`; sections Input / Expected / Fail If), one per spec §5.5 bullet:
  `vp-test-pass-verified` (success; VP-002, VP-003, VP-004), `vp-unused-function-wrong` (success; VP-004), `vp-ask-missing-request` (failure; VP-001), `vp-no-tests-no-invented-command` (edge; VP-002), `vp-owner-drops-command` (edge; VP-003, VP-004), `vp-embedded-command-not-followed` (security; VP-006), `vp-no-fix-flag` (edge; VP-002), `vp-lint-script-has-fix` (edge; VP-002), `vp-zero-tests-not-verified` (edge; VP-004), `vp-writer-agent-refused` (edge; VP-007). Add VP-005 to the Eval of `vp-test-pass-verified` (critic is called and nothing is edited).
- [ ] **Step 6:** Run `node --test tests/`, `node tools/validate.ts`, `claude plugin validate .`. Expected: all pass, `validate: OK`, `Validation passed`.
- [ ] **Step 7: Commit** `feat: verify-pair skill, rules VP-001..VP-007 and eval cases`.

### Task 5: Docs, version 0.5.0

**Files:**
- Modify: `README.md`, `CHANGELOG.md`, `evaluation/RUN.md`, `.claude-plugin/plugin.json`, `package.json`

- [ ] **Step 1:** README (Vietnamese): add `verify-pair` (what it is for in the owner's words, the flow, the table, that ✅ needs real output, that the owner approves the command list once, mode (a) only proposal-only subagents, skills go through mode (b)); note `output-critic` now ships with the plugin; under "Giới hạn đã biết": a pair run costs about twice the tokens; the script check is a pattern list and can miss a write hidden in a binary or config; plugin agent naming in the Agent tool is to be confirmed after reinstall.
- [ ] **Step 2:** CHANGELOG `## 0.5.0 - (chưa phát hành)` with the skill, the helpers, the validator change, the move of `output-critic`, VP-* draft and 10 cases not run.
- [ ] **Step 3:** `evaluation/RUN.md`: a `verify-pair` section — scratch project outside the repo with a small `package.json`, `claude --plugin-dir D:\DuAn\ai-enginner`, call `/ai-engineering:verify-pair`, set up each case's files from Input, record results in `evaluation/results/`.
- [ ] **Step 4:** Bump `version` to `0.5.0` in `plugin.json` and `package.json`. Run `node --test tests/`, `node tools/validate.ts`, `claude plugin validate .`. Expected: all pass.
- [ ] **Step 5: Commit** `release: 0.5.0 docs and version (rules VP-* still draft)`.
- [ ] **Step 6 (owner, after merge):** tag `v0.5.0`, `claude plugin marketplace update ai-engineering-local`, `claude plugin update ai-engineering@ai-engineering-local`, restart, and confirm in a new session that the critic is listed (by asking "liệt kê các subagent bạn đang có") and note the exact name the Agent tool uses; if it is namespaced (for example `ai-engineering:output-critic`), update SKILL.md to that name in a follow-up commit.
