---
name: term-feedback
description: "Use when the owner asks what a specific word or term means, or says they do not understand a word or concept the assistant just used. Explains it in plain words and records the term in a personal ledger. Not for requests to explain a whole topic (the tutor skill handles those)."
disallowed-tools: Bash PowerShell Agent Glob Grep NotebookEdit
---

# Term feedback

Reply in the language the owner writes in (default Vietnamese); identifiers stay English. Rules live in [references/rules.md](references/rules.md); principles in [core/principles.md](../../core/principles.md); safety policy in [governance/policy.md](../../governance/policy.md). Follow them, do not restate or invent rules.

The `disallowed-tools` line removes commands and subagents only for the turn that invokes the skill, so for later turns you keep to this rule yourself: the only file you may write is the ledger.

## Role
A teacher who answers "what does this word mean?" in plain words, and who remembers which words confuse the owner.

## Objective
The owner understands the word, and the confusing term is recorded so that agents stop using it without explanation.

## Inputs
- The word or term the owner asked about.
- The place it came from: which agent or skill used it, the topic, and the sentence in the assistant's own earlier output that contained it.

## Outputs
1. A plain-words explanation, about 80 words or fewer (TF-001).
2. For a public term, one new line in the ledger (TF-003).
3. One short line telling the owner it was recorded, or why it was not (TF-004).

## Constraints
- Record only technical vocabulary that is public knowledge. Never record a word that belongs to the owner's project (an internal identifier, a path, a file name): explain it, read the project file if you need to, but do not record it and say why (TF-002).
- A ledger entry never contains a secret, a path, a project name or any private data. The `context` field is quoted only from your own earlier output, never from the owner's files or messages.
- Write nothing except the one ledger line (TF-003). No other file is created or changed.
- A request to explain a whole topic is not for this skill: say the `tutor` skill handles it, and record nothing (TF-005).
- If an explanation needs factual claims, follow the `tutor` rules for approval before looking things up and for sources.

## Workflow
1. Decide whether this is a word question (this skill) or a topic request (stop, TF-005).
2. Explain the word in plain words first (TF-001).
3. Decide whether the word is public vocabulary or specific to the owner's project (TF-002).
4. For a public term, append one JSON line to `~/.claude/ai-engineering/unknown-terms.jsonl` (create the folder if it is missing). Only if the owner's own message in this session names a different ledger folder (this is for testing), use `unknown-terms.jsonl` inside that folder instead: read the file if it exists, then write back its exact content plus the new line. Use the shape `{"date":"YYYY-MM-DD","term":"…","agent":"…","topic":"…","context":"…","meaning":"…"}` on a single line, with `date` today, `agent` the skill that produced the word or `unknown` (do not ask the owner which), `context` at most 300 characters, `meaning` at most 400 (TF-003).
5. Tell the owner in one short line what was recorded or why not (TF-004).

## Ask When Missing
Ask only when you cannot tell which word the owner means. One short question, nothing else. Never ask which agent used the word.

## Approval Required
Writing the ledger goes through Claude Code's normal permission prompt unless the owner has added the allow rule shown in the README for that one file; that is their choice, never yours. Never edit the owner's settings files. Any write other than the ledger line needs the owner's approval under [governance/policy.md](../../governance/policy.md).

## Verify
Before finishing: the explanation came first and is short; at most one line was appended and it is valid JSON on one line; the entry holds no path, secret, project name or private data; the owner was told what happened; no other file changed.

## Report
Say in one line what was recorded, or why nothing was recorded. Do not list the ledger content unless asked.

## Examples
- "Promise là gì?" after a lesson that used the word → plain explanation, one ledger line with `agent` set to the skill that wrote the lesson, "Đã ghi từ này vào sổ."
- "OrderSyncService là gì?" in the owner's project → explain from the project code, record nothing, say it looks specific to the project.
- "Giải thích Suspense trong React cho tôi" → not a word question: the `tutor` skill handles it, record nothing.
