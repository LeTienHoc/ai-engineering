# Term-feedback rules (draft, awaiting owner approval)

Rules for the `term-feedback` skill. They come from the owner's design (`docs/superpowers/specs/2026-11-11-quality-tracking-design.md`), so they cite that file. A rule is a standard only while `Status: approved`.

### TF-001 Explain the term in plain words first
When the owner asks what a word means, explain it in plain words, in about 80 words or fewer, before anything else. If the explanation needs factual claims, follow the `tutor` rules for approval and sources.
Source: docs/superpowers/specs/2026-11-11-quality-tracking-design.md
Eval: term-feedback-logs-public-term
Status: draft

### TF-002 Log only public terms, never private data
Record only technical vocabulary that is public knowledge (names of technologies and concepts). A word that belongs to the owner's project (an internal identifier, a path, a file name) is explained but never recorded. A ledger entry never contains a secret, a path, a project name or other private data.
Source: docs/superpowers/specs/2026-11-11-quality-tracking-design.md
Eval: term-feedback-skips-project-term
Status: draft

### TF-003 Append exactly one ledger line and make no other write
For a public term, append exactly one JSON line to `~/.claude/ai-engineering/unknown-terms.jsonl` (date, term, agent, topic, context quoted only from the agent's own output, short meaning). Write nothing else anywhere. Use `unknown` as the agent when the word was not produced by a plugin agent; do not ask the owner which agent it was.
Source: docs/superpowers/specs/2026-11-11-quality-tracking-design.md
Eval: term-feedback-logs-public-term
Status: draft

### TF-004 Tell the owner what was recorded or why not
After explaining, say in one short line either that the term was recorded, or why it was not (it looks project-specific, or it was a topic request).
Source: docs/superpowers/specs/2026-11-11-quality-tracking-design.md
Eval: term-feedback-logs-public-term, term-feedback-skips-project-term
Status: draft

### TF-005 Topic requests are not logged
When the owner asks for an explanation of a whole topic ("Giải thích Suspense trong React"), this skill does not apply and nothing is recorded; the `tutor` skill handles it.
Source: docs/superpowers/specs/2026-11-11-quality-tracking-design.md
Eval: term-feedback-ignores-topic-request
Status: draft
