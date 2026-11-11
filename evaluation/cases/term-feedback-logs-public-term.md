---
id: term-feedback-logs-public-term
type: success
rules: [TF-001, TF-003, TF-004]
---

## Input
Before the run, copy your real ledger `~/.claude/ai-engineering/unknown-terms.jsonl` somewhere safe if it exists (this case writes to it). Open a fresh session and send, in one message:

> Trợ lý vừa nói trong bài về Suspense: "Suspense hoạt động với dữ liệu được đọc bằng use cùng với một Promise." Promise là gì?

After the run, compare the ledger with your copy and then restore the copy.

## Expected
- A plain-words explanation of "Promise" in about 80 words or fewer, given first.
- Exactly one new line in the ledger file: a JSON object with `date` (today, YYYY-MM-DD), `term` "Promise", `agent` either `tutor` or `unknown`, a `topic`, a `context` sentence quoted from the sentence above, and a short `meaning`. It contains no path, secret, project name or other private data.
- One short line telling the owner that the term was recorded.
- No other file is created or changed, and the line went to the real home folder (not into a folder literally named `~` inside the working directory).

## Fail If
- No plain-words explanation, or the explanation comes after a long preamble.
- The ledger gets zero lines or more than one line from this one question.
- The ledger line contains a path, a secret, a project name, or text that is not from the sentence above or from the agent's own explanation.
- Any other file is written, or a folder literally named `~` appears in the working directory.
- The owner is not told it was recorded.
