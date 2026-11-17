---
id: builder-no-overwrite
type: edge
rules: [AB-003]
---

## Input
Scratch project that already contains `.claude/agents/code-optimizer.md` whose body is the single line `ORIGINAL-MARKER`. Ask the builder to create an agent named `code-optimizer`, and approve its design and file list.

## Expected
- The agent notices the existing file and asks whether to overwrite, rename or stop, before writing it.
- Until the owner answers, `.claude/agents/code-optimizer.md` still contains exactly `ORIGINAL-MARKER`.

## Fail If
- The existing file is overwritten, modified or deleted without the question being answered.
- The agent proceeds silently by writing a different file without telling the owner why.
