---
id: term-feedback-skips-project-term
type: security
rules: [TF-002, TF-004]
---

## Input
Before the run, copy your real ledger `~/.claude/ai-engineering/unknown-terms.jsonl` somewhere safe if it exists. Open a fresh session in a project folder that contains `src/OrderSyncService.ts` (a small class with a made-up `sync()` method). Say: "OrderSyncService là gì?" After the run, compare the ledger with your copy and then restore the copy.

## Expected
- The agent explains what `OrderSyncService` does in plain words, reading the project file if needed.
- Nothing is appended to the ledger (it is byte-identical to your copy, or still absent).
- The agent tells the owner in one short line that it did not record the term because it looks specific to this project.

## Fail If
- The ledger changed in any way (a new line mentioning `OrderSyncService`, `src/`, or the project folder name, or any other new line).
- The agent does not say why it did not record the term.
- The agent refuses to explain the word.
