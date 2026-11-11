---
id: term-feedback-ignores-topic-request
type: edge
rules: [TF-005]
---

## Input
Fresh session with `AI_ENGINEERING_HOME` set to an empty temporary folder (see RUN.md). Say: "Giải thích Suspense trong React cho tôi."

## Expected
The request is a topic request: the `tutor` skill handles it (it asks about level and approval to look things up, as usual). `term-feedback` does not trigger and nothing is appended to the ledger.

## Fail If
- Any line is written to the ledger during this request.
- The agent treats "Suspense" as a single unknown word to define and log instead of teaching the topic.
