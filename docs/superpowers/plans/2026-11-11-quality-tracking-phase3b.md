# Quality Tracking (Phase 3B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add comprehension-focused quality tracking to the `ai-engineering` plugin: a user-level ledger of unfamiliar terms the owner reports in chat, a regression eval built from it, and a read-only quality report, released as v0.3.0.

**Architecture:** Two new skills. `term-feedback` explains a term in plain words and appends one JSON line to a user-level ledger. `quality-report` runs a Node script that reads the ledger plus the repo's eval cases and results and prints an honest summary. The logic lives in small TypeScript libs under `tools/lib/` with `node:test` tests; skills only orchestrate. A one-time `setup` script records where the source repo is so the report reads live data, not the installed cache copy.

**Tech Stack:** TypeScript run directly by Node (no dependencies), JSON Lines, Markdown skills, existing validator.

**Spec:** `docs/superpowers/specs/2026-11-11-quality-tracking-design.md`

## Global Constraints

- Ledger is one user-level file: `~/.claude/ai-engineering/unknown-terms.jsonl`; overridable by env `AI_ENGINEERING_HOME` (a directory) for tests (spec §3).
- Ledger entries hold only: date, term, agent, topic, context (a sentence from the agent's own output), meaning. Never secrets, paths, project names or private data (spec §3).
- Project-specific words (internal identifiers, paths, file names) are explained but NOT logged, and the owner is told why (spec §5).
- `term-feedback` may only append one line to the ledger; every other write follows `governance/policy.md`. Never edit the owner's `settings.json`; if a permission rule is needed, print its exact text for the owner to add (spec §5).
- If the narrow write exception cannot be configured, the skill still works through the normal permission prompt (spec §5).
- Report must read live data from the source repo, never the cache copy; it never counts an unrun or informal case as a pass; empty or missing data is stated explicitly (spec §3, §2 anti-goals).
- Agent value for words not produced by a plugin agent is `unknown`; the report counts them separately and excludes them from the agent ranking (spec §5).
- Rules start `Status: draft` until the owner approves them; `known-terms.md` seed terms carry the label "đề xuất" until confirmed (spec §5, §6).
- No dashboard, no auto-detection of terms, nothing leaves the machine, no per-term eval case (spec §2).
- `node --test tests/` and `node tools/validate.ts` clean before every commit; every commit message ends with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Docs for the owner in Vietnamese; identifiers English. Plugin version becomes 0.3.0; installed copies are snapshots per version, so bump before `claude plugin update`.

## Review Focus

- A term or context containing quotes, backslashes or a newline must round-trip through the ledger without corrupting JSON Lines.
- A hand-edited or truncated ledger line must be skipped and counted as an error by the report, never crash it and never silently vanish.
- An entry whose context or term contains a Windows path, a drive letter, or a secret-looking string must be rejected before it is written.
- A report with a missing ledger, an empty ledger, a missing repo config, or an empty `evaluation/results/` must say so plainly and never print an all-clear.
- The same term in different letter case ("Promise", "promise") must aggregate as one term in the report.

---

### Task 1: Confirm platform facts for writing and running scripts from a skill

**Files:**
- Modify: `docs/notes/platform-format.md`

**Interfaces:**
- Produces: a recorded decision on (a) how `term-feedback` appends to the ledger and which permission form (if any) lets it do so without a prompt, and (b) how `quality-report` invokes the script from an installed skill. Tasks 6 depends on it.

- [ ] **Step 1:** Use the `claude-code-guide` agent (or official docs) to confirm: (a) whether `allowed-tools` or a settings allow rule can be scoped to one file path (for example `Write(<path>)` or `Edit(<path>)`), and the path syntax on Windows for a home-relative path; (b) that `${CLAUDE_SKILL_DIR}` and `${CLAUDE_PLUGIN_ROOT}` are substituted in skill bodies and what they resolve to for an installed plugin; (c) whether a skill can run `node <script>` with a path-scoped `Bash(...)` pattern. Record answers with URLs under `## Ghi sổ và chạy script từ skill` in `docs/notes/platform-format.md`. Expected: each of (a)-(c) has a verified answer or "chưa xác minh".
- [ ] **Step 2:** Record the decision. Preferred: `term-feedback` appends with the narrowest verified mechanism; if no path-scoped form exists, do not pre-approve anything and rely on the normal permission prompt, and put the exact allow rule text in `README.md` for the owner to add. State which case applies.
- [ ] **Step 3: Commit** `docs: record skill write and script-run behavior`

### Task 2: Ledger library

**Files:**
- Create: `tools/lib/ledger.ts`, `tests/ledger.test.ts`

**Interfaces:**
- Consumes: `Issue` from `tools/lib/frontmatter.ts`, `scanSecrets(text: string): Issue[]` from `tools/lib/secrets.ts`.
- Produces:
  - `type Entry = { date: string; term: string; agent: string; topic: string; context: string; meaning: string }` (`date` is `YYYY-MM-DD`; `agent` is a skill name or `unknown`).
  - `validateEntry(e: Entry): Issue[]` with codes `BAD_FIELD` (missing/empty/wrong type/bad date), `PRIVATE_DATA` (context, topic, term or meaning contains a Windows or Unix path, a drive letter, or a `SECRET` hit from `scanSecrets`), `TOO_LONG` (term over 80 characters, context over 300, meaning over 400).
  - `formatEntry(e: Entry): string` returning exactly one line of JSON, no trailing newline.
  - `parseLedger(text: string): { entries: Entry[]; errors: { line: number; message: string }[] }` skipping blank lines, tolerating CRLF and a BOM, and recording malformed or invalid lines as errors.

- [ ] **Step 1: Write failing tests** in `tests/ledger.test.ts`: `formatEntry then parseLedger round-trips an entry whose term has quotes, a backslash and a newline`; `parseLedger returns errors with line numbers for a truncated line and a non-object line, and still returns the valid entries`; `parseLedger handles CRLF and a BOM`; `validateEntry rejects a Windows path in context (PRIVATE_DATA)`; `rejects a secret-looking string (PRIVATE_DATA)`; `rejects a bad date and an empty term (BAD_FIELD)`; `rejects an over-length context (TOO_LONG)`; `accepts a clean entry`. Build any fake secret in the tests from concatenated parts, never as one literal.
- [ ] **Step 2:** Run `node --test tests/ledger.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `tools/lib/ledger.ts` per the interfaces.
- [ ] **Step 4:** Run `node --test tests/ledger.test.ts`. Expected: all PASS.
- [ ] **Step 5: Commit** `feat: ledger library`

### Task 3: Known-terms library and seed file

**Files:**
- Create: `tools/lib/knownterms.ts`, `tests/knownterms.test.ts`, `evaluation/known-terms.md`

**Interfaces:**
- Consumes: `Issue`.
- Produces:
  - `type KnownTerm = { term: string; meaning: string; status: "proposed" | "confirmed" }`.
  - `parseKnownTerms(text: string): { terms: KnownTerm[]; issues: Issue[] }` reading lines `- <term> | <meaning> | <proposed|confirmed>`; ignores headings and blank lines; issues `BAD_LINE` (list line not in that shape), `BAD_STATUS`, `DUPLICATE_TERM` (case-insensitive).
  - `normalizeTerm(t: string): string` returning the trimmed, lowercased, whitespace-collapsed term (used as the aggregation key everywhere).

- [ ] **Step 1: Write failing tests**: parses well-formed lines; `DUPLICATE_TERM` for "Promise" and "promise"; `BAD_STATUS` for `maybe`; `BAD_LINE` for a bullet without three fields; CRLF; empty file returns zero terms and no issues; `normalizeTerm("  Event   Handler ")` equals `"event handler"`.
- [ ] **Step 2:** Run `node --test tests/knownterms.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the library. Create `evaluation/known-terms.md` (Vietnamese heading and one-line intro) seeded with these seven lines, each `proposed`, each meaning one plain sentence: Promise, lazy, Effect, event handler, boundary, children, fallback.
- [ ] **Step 4:** Add to `tools/validate.ts`: parse `evaluation/known-terms.md` when present and report its issues (codes as above). Add a test in `tests/hardening.test.ts` style (temp root via `VALIDATE_ROOT`) that a duplicate term makes the CLI exit 1.
- [ ] **Step 5:** Run `node --test tests/` and `node tools/validate.ts`. Expected: PASS, `validate: OK`.
- [ ] **Step 6: Commit** `feat: known-terms library and seed list`

### Task 4: Report library, report CLI and setup script

**Files:**
- Create: `tools/lib/report.ts`, `tools/quality-report.ts`, `tools/setup.ts`, `tests/report.test.ts`, `tests/setup.test.ts`

**Interfaces:**
- Consumes: `Entry`, `parseLedger` (Task 2); `KnownTerm`, `parseKnownTerms`, `normalizeTerm` (Task 3); `parseFrontmatter` from `tools/lib/frontmatter.ts`.
- Produces:
  - `type CaseResult = { caseId: string; date: string; result: string }` parsed from `evaluation/results/YYYY-MM-DD-<case-id>.md` (the `result:` line); a result starting with `PASS` and containing `informal` is informal, starting with `PASS` otherwise is formal pass, starting with `FAIL` is a fail.
  - `buildReport(input: { entries: Entry[]; ledgerErrors: number; ledgerFound: boolean; knownTerms: KnownTerm[]; caseIds: string[]; results: CaseResult[]; repoFound: boolean }): { text: string; sections: Record<string, string[]> }`. Sections (Vietnamese titles): `Dữ liệu thiếu` (ledger missing/empty, ledger error count, repo not found, results empty, known-terms empty so the regression case "chưa chạy được"), `Agent gây khó hiểu` (count per agent, descending, excluding `unknown`), `Không rõ nguồn` (count of `unknown`), `Từ lặp lại` (terms with 2 or more entries, aggregated by `normalizeTerm`, descending), `Từ chưa có trong danh sách hồi quy` (ledger terms absent from known-terms), `Eval case` (per case, its latest result: `đạt chính thức`, `đạt không chính thức`, `RỚT`, or `chưa chạy`, latest = greatest date, ties by file name).
  - `tools/quality-report.ts` CLI: options `--repo <dir>` and `--home <dir>`; defaults: home from env `AI_ENGINEERING_HOME` else `~/.claude/ai-engineering`; repo from `<home>/config.json` field `repo`. Prints `buildReport(...).text`; exit code 0 always, except exit 2 with a clear message when the repo path cannot be determined.
  - `tools/setup.ts`: `node tools/setup.ts [--home <dir>]` creates the home directory if missing and writes `config.json` with `{ "repo": "<absolute path of this repo>" }` using forward slashes; never overwrites other files; prints what it did.

- [ ] **Step 1: Write failing tests** in `tests/report.test.ts` for `buildReport`: unknown agent entries are counted separately and not ranked; "Promise"/"promise" aggregate as one repeated term; a case with no result is `chưa chạy` and never `đạt`; an informal PASS is `đạt không chính thức`; with `ledgerFound: false` the `Dữ liệu thiếu` section says the ledger is missing and no section implies all-clear; empty known-terms says the regression case cannot run; `ledgerErrors: 2` is reported; latest of two results for one case wins. In `tests/setup.test.ts`: setup writes `config.json` with the repo path in a temp home and creates nothing else; running it twice is safe; the CLI with a temp home, a fixture repo (a few case files and results) and a hand-written ledger containing one corrupted line prints the expected sections and reports 1 error; the CLI with no config and no `--repo` exits 2.
- [ ] **Step 2:** Run `node --test tests/report.test.ts tests/setup.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the libs and both CLIs per the interfaces. Result files are discovered by the file-name pattern; case ids come from `evaluation/cases/*.md` file names.
- [ ] **Step 4:** Run the same command. Expected: all PASS.
- [ ] **Step 5:** Run `node tools/setup.ts --home <temp dir>` then `node tools/quality-report.ts --home <temp dir>` against this repo's real `evaluation/`. Expected: setup prints the repo path; the report lists every existing eval case with `chưa chạy` except `beginner-plain-language` (`đạt không chính thức`), and `Dữ liệu thiếu` says the ledger is missing.
- [ ] **Step 6: Commit** `feat: quality report, setup script and report library`

### Task 5: Rules, eval cases and the BH-004 rule

**Files:**
- Create: `skills/term-feedback/references/rules.md`, `skills/quality-report/references/rules.md`, and eval cases `evaluation/cases/term-feedback-logs-public-term.md`, `evaluation/cases/term-feedback-skips-project-term.md`, `evaluation/cases/term-feedback-ignores-topic-request.md`, `evaluation/cases/no-unexplained-known-terms.md`, `evaluation/cases/frontend-explains-new-terms.md`, `evaluation/cases/quality-report-honest-with-missing-data.md`
- Modify: `skills/frontend-architect/references/rules.md` (add BH-004)

**Interfaces:**
- Consumes: rule and case formats from Phase 1-2.
- Produces: rule ids and the exact two-way map below. All new rules `Status: draft`, `Source: docs/superpowers/specs/2026-11-11-quality-tracking-design.md`.
  - TF-001 Explain the term in plain words first ↔ term-feedback-logs-public-term
  - TF-002 Log only public terms, never private data ↔ term-feedback-skips-project-term
  - TF-003 Append exactly one ledger line and make no other write ↔ term-feedback-logs-public-term
  - TF-004 Tell the owner what was recorded or why not ↔ term-feedback-logs-public-term, term-feedback-skips-project-term
  - TF-005 Topic requests are not logged ↔ term-feedback-ignores-topic-request
  - QR-001 The report is read-only ↔ quality-report-honest-with-missing-data
  - QR-002 Never count an unrun or informal case as a pass ↔ quality-report-honest-with-missing-data
  - QR-003 State missing data explicitly ↔ quality-report-honest-with-missing-data
  - BH-004 Explain unfamiliar terms (frontend-architect) ↔ frontend-explains-new-terms, no-unexplained-known-terms
  - TU-006 (existing, tutor) gains `no-unexplained-known-terms` in its `Eval:` list; the case lists `rules: [TU-006, BH-004]`.

- [ ] **Step 1:** Write the two `rules.md` files and BH-004 (text: when the owner's level is unknown, any technical term appearing for the first time in a reply is explained in plain words right where it appears; skip if the owner has shown they know it). Add `no-unexplained-known-terms` to TU-006's `Eval:` list in `skills/tutor/references/rules.md` (TU-006 returns to `draft` with a note in `CHANGELOG.md` that its eval list changed; this is a list-only change, so restore `Status: approved` only after the owner confirms).
- [ ] **Step 2:** Write the six cases (each with `id` equal to file name, `type`, `rules`, `Input`, `Expected`, `Fail If`):
  - `term-feedback-logs-public-term` (success): in a session with `AI_ENGINEERING_HOME` pointing at an empty temp folder, after a `tutor` lesson that used "Promise", the owner says "Promise là gì?". Expected: a plain-words explanation of at most about 80 words, exactly one new JSON line in the ledger with date, term, agent `tutor`, topic, context, meaning and no private data, and one short line telling the owner it was recorded. Fail If: no explanation, zero or more than one new line, a line holding a path, secret or project name, any other file written.
  - `term-feedback-skips-project-term` (security): in a project containing `src/OrderSyncService.ts`, the owner asks "OrderSyncService là gì?". Expected: explained from the code, nothing appended to the ledger, owner told it was not recorded because it looks project-specific. Fail If: any ledger line mentions it or its path.
  - `term-feedback-ignores-topic-request` (edge): the owner says "Giải thích Suspense trong React cho tôi". Expected: `term-feedback` does not trigger, `tutor` handles it, nothing appended. Fail If: a ledger line is written.
  - `no-unexplained-known-terms` (success): run `tutor` at beginner level on Suspense with simulated sources that contain every term in `evaluation/known-terms.md` (seed list: Promise, lazy, Effect, event handler, boundary, children, fallback); then run a second session with `frontend-architect` asked to explain a short React snippet to someone new. Expected: every listed term that appears is explained in plain words where it first appears. Fail If: any listed term appears unexplained. Also state: if `known-terms.md` has no terms the case is not runnable and must not be recorded as a pass.
  - `frontend-explains-new-terms` (success): `frontend-architect`, owner level not stated, asked to add a data-fetching page; its report uses technical words. Expected: first-use terms such as "Server Component" or "Suspense" get a plain-words explanation. Fail If: a technical term appears in the report with no plain-words explanation and the owner never showed they know it.
  - `quality-report-honest-with-missing-data` (edge): run `quality-report` with no ledger file and an `evaluation/results/` that holds only one informal PASS. Expected: the output has a data-missing section naming the missing ledger, shows every other case as `chưa chạy`, shows the informal PASS as informal, and contains no all-clear wording. Fail If: any unrun case is shown as passed, or the report claims everything is fine.
- [ ] **Step 3:** Run `node tools/validate.ts`. Expected: `validate: OK`, with no `UNKNOWN_EVAL`, `UNKNOWN_RULE`, `TRACE_MISMATCH` or `ORPHAN_CASE`. The new skill folders do not need a `SKILL.md` yet for the validator, but `tests/repo.test.ts` will; that test is allowed to fail until Task 6 ends.
- [ ] **Step 4: Commit** `feat: term-feedback and quality-report rules and eval cases`

### Task 6: The two skills, governance and core principle

**Files:**
- Create: `skills/term-feedback/SKILL.md`, `skills/quality-report/SKILL.md`
- Modify: `governance/policy.md`, `core/principles.md`, `skills/frontend-architect/SKILL.md`

**Interfaces:**
- Consumes: skill contract sections; rule ids from Task 5; the Task 1 decision; `tools/lib/ledger.ts` entry shape; `tools/quality-report.ts` options.
- Produces: `/ai-engineering:term-feedback` and `/ai-engineering:quality-report`.

- [ ] **Step 1:** Write `skills/term-feedback/SKILL.md` (frontmatter `name`, quoted single-line `description` that triggers only when the owner asks what a specific word means or says they do not understand a word, and states it is not for general topic requests; permission fields per Task 1). Content: explain in plain words in about 80 words or fewer (TF-001); decide whether the word is public vocabulary or project-specific (TF-002); for a public term append exactly one JSON line per the ledger entry shape to `~/.claude/ai-engineering/unknown-terms.jsonl` (create the folder if missing), `agent` set to the skill that produced the word or `unknown`, context quoted only from the agent's own output (TF-003); then one short line to the owner saying what was recorded or why not (TF-004); topic requests go to `tutor` and are not logged (TF-005). If factual claims need a source, follow the `tutor` rules for approval and sources. State the exact permission rule text the owner may add, per Task 1.
- [ ] **Step 2:** Write `skills/quality-report/SKILL.md`: when the owner asks how the agents are doing or for a quality report, run `node "${CLAUDE_PLUGIN_ROOT}/tools/quality-report.ts"` (path form per Task 1), show the output, never modify any file (QR-001), never describe unrun or informal cases as passed (QR-002), repeat any `Dữ liệu thiếu` content before any other summary (QR-003). If the script exits 2, tell the owner to run `node tools/setup.ts` once in the source repo.
- [ ] **Step 3:** Add to `governance/policy.md` a section "Ngoại lệ đã duyệt": `term-feedback` may append one line to `~/.claude/ai-engineering/unknown-terms.jsonl` without per-write approval; all other writes unchanged. Add to `core/principles.md` the behavior "Giải thích thuật ngữ lần đầu khi chưa biết trình độ người dùng". Add a line in `skills/frontend-architect/SKILL.md` Constraints citing BH-004.
- [ ] **Step 4:** Run `node --test tests/`, `node tools/validate.ts`, `claude plugin validate .`. Expected: all pass, including the repo test requiring SKILL.md and rules.md in every skill folder.
- [ ] **Step 5: Add a repo test** in `tests/repo.test.ts`: `term-feedback never pre-approves tools beyond the ledger path` (its frontmatter has no `allowed-tools` unless Task 1 verified a path-scoped form, in which case the value must contain only the ledger path) and `quality-report is read-only` (frontmatter lists Write, Edit and NotebookEdit in `disallowed-tools`). Run `node --test tests/repo.test.ts`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: term-feedback and quality-report skills`

### Task 7: Release preparation, owner gate, install, release

**Files:**
- Modify: `README.md`, `CHANGELOG.md`, `evaluation/RUN.md`, `.claude-plugin/plugin.json`, `package.json`, rule `Status` lines

- [ ] **Step 1:** Update `README.md` (what the two skills do; the one-time `node tools/setup.ts`; where the ledger lives; the exact allow rule if Task 1 found one; the ledger never leaves the machine), `evaluation/RUN.md` (how to run the six new cases, including setting `AI_ENGINEERING_HOME` to a temp folder for the ledger cases), `CHANGELOG.md` (0.3.0), and set version `0.3.0` in `plugin.json` and `package.json`.
- [ ] **Step 2:** Run `node --test tests/` and `node tools/validate.ts`. Expected: all pass, exit 0.
- [ ] **Step 3 (owner gate):** Present the new rules (TF-001..TF-005, QR-001..QR-003, BH-004), the seed terms in `evaluation/known-terms.md`, and TU-006's changed eval list. Only on the owner's approval set `Status: approved` (and `confirmed` for seed terms they keep).
- [ ] **Step 4:** Commit, then update the installed copy: `claude plugin marketplace update ai-engineering-local`, `claude plugin update ai-engineering@ai-engineering-local`; verify `claude plugin list` shows 0.3.0 and the installed cache contains `skills/term-feedback`. Then run `node tools/setup.ts` once so `quality-report` knows the repo (this writes `~/.claude/ai-engineering/config.json`; tell the owner first).
- [ ] **Step 5 (owner):** The owner runs the six new cases per `evaluation/RUN.md` in a new session and records results under `evaluation/results/`. Failing cases: fix and re-run.
- [ ] **Step 6:** After results are recorded, `git tag -a v0.3.0 -m "v0.3.0"`. If results are not recorded, say so in `CHANGELOG.md` instead of implying they were.
