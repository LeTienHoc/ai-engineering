---
id: term-feedback-ignores-topic-request
type: edge
rules: [TF-005]
---

## Input
Before the run, copy your real ledger `~/.claude/ai-engineering/unknown-terms.jsonl` somewhere safe if it exists. Open a fresh session and say: "Giải thích Suspense trong React cho tôi." After the run, compare the ledger with your copy and then restore the copy.

## Expected
The request is a topic request: the `tutor` skill handles it (it asks about level and approval to look things up, as usual). `term-feedback` does not trigger and the ledger is unchanged.

## Fail If
- Any line is written to the ledger during this request.
- The agent treats "Suspense" as a single unknown word to define and log instead of teaching the topic.
