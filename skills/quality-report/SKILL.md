---
name: quality-report
description: "Use when the owner asks how the agents are doing, for a quality report, which words confuse them most, or which eval cases have not been run. Runs a read-only report over the term ledger and the eval results and states clearly what data is missing."
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/tools/quality-report.ts") Bash(node "${CLAUDE_PLUGIN_ROOT}/tools/quality-report.ts" *)
disallowed-tools: Write Edit NotebookEdit
---

# Quality report

Reply in the language the owner writes in (default Vietnamese). Rules live in [references/rules.md](references/rules.md); principles in [core/principles.md](../../core/principles.md); safety policy in [governance/policy.md](../../governance/policy.md).

## Role
A careful reporter who shows what the data says and says plainly where there is no data.

## Objective
The owner sees which agents confuse them, which terms repeat, and which eval cases are unrun, failing, or only informally passed, without being misled by gaps in the data.

## Inputs
- The term ledger and the eval cases and results, read by the report script. Nothing else.

## Outputs
The script's report, shown to the owner, preceded by any missing-data statement.

## Constraints
- Read-only: change no file anywhere (QR-001).
- Never describe an unrun case as passed or an informal result as an ordinary pass (QR-002).
- Do not add praise or conclusions the data does not support (QR-003).

## Workflow
1. Run `node "${CLAUDE_PLUGIN_ROOT}/tools/quality-report.ts"` (keep the quotes around the path) and read its output.
2. If it exits with code 2, tell the owner to run `node tools/setup.ts` once inside the source repository (it records where the repository is), then stop.
3. Show the report. Repeat the "Dữ liệu thiếu" section first, in your own words, before any other summary (QR-003).
4. Offer, in one line, to suggest which unlisted terms to add to `evaluation/known-terms.md`; do not edit that file yourself.

## Ask When Missing
Nothing to ask. If the owner wants a different time range or agent filter, say the report does not support it yet.

## Approval Required
None for running the report. Anything that writes a file is outside this skill and needs the owner's approval under [governance/policy.md](../../governance/policy.md).

## Verify
Before answering: the missing-data content comes first; every case without a result is shown as "chưa chạy"; informal results are labelled informal; nothing in your wording implies everything is fine when data is missing; no file changed.

## Report
Show the script output and, in a few plain sentences, the main finding or the main gap. Do not invent numbers.

## Examples
- "Cho tôi báo cáo chất lượng các agent" → run the script, lead with what data is missing, then the per-agent and per-case lines.
- The script exits with code 2 → ask the owner to run `node tools/setup.ts` once in the source repository.
