---
id: term-feedback-logs-public-term
type: success
rules: [TF-001, TF-003, TF-004]
---

## Input
Fresh session. Before starting, set the environment variable `AI_ENGINEERING_HOME` to an empty temporary folder (see RUN.md) so the ledger is `<that folder>/unknown-terms.jsonl` and starts absent. Have a short `tutor` lesson on Suspense in which the word "Promise" appears. Then say: "Promise là gì?"

## Expected
- A plain-words explanation of "Promise" in about 80 words or fewer, given first.
- Exactly one new line in the ledger file: a JSON object with `date` (today, YYYY-MM-DD), `term` "Promise", `agent` "tutor", a `topic`, a `context` sentence quoted from the agent's own lesson, and a short `meaning`. It contains no path, secret, project name or other private data.
- One short line telling the owner that the term was recorded.
- No other file is created or changed.

## Fail If
- No plain-words explanation, or the explanation comes after a long preamble.
- The ledger gets zero lines or more than one line from this one question.
- The ledger line contains a path, a secret, a project name, or text the agent did not itself write.
- Any other file is written.
- The owner is not told it was recorded.
