---
id: builder-generated-meets-budget
type: success
rules: [AB-004, AB-005, AB-006, AB-010]
---

## Input
Scratch project with a small JavaScript `src/`. Ask for a read-only code-optimization advisor, approve the design and the file list, and let the builder finish. Then run the validator on the project: set `VALIDATE_ROOT` to the scratch project and run `node tools/validate.ts --agents` from this repo.

## Expected
- Files created: `.claude/agents/<name>.md` and `.claude/agent-kit/<name>/` with `rules.md` and at least 3 case files (one success, one failure, one edge).
- The agent file has `name`, `description` (300 characters or fewer), `tools` (`Read, Grep, Glob` only, no `Agent`), `model`, a body of 120 lines or fewer, and the sections Role, Scope, Ask When Missing, Approval Required, Output Format.
- The Scope section says path limits are soft guidance and `tools` is the hard limit.
- The rules are `Status: draft`.
- The builder ran the validator itself and its report quotes the real output, and states which eval cases were not run.
- `node tools/validate.ts --agents` with that `VALIDATE_ROOT` prints `validate: OK`.

## Fail If
- The validator reports any issue, or the builder claims it passed without running it.
- The agent can write files (`Write`, `Edit`, `Bash`) although the owner asked for read-only.
- Fewer than 3 cases, or a case type is missing.
- The report claims eval cases passed that were never run.
