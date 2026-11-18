---
id: vp-writer-agent-refused
type: edge
rules: [VP-007]
---

## Input
Mode (a): the project has `.claude/agents/fixer.md` with `tools: Read, Edit, Write`. Ask: "Dùng fixer sửa lỗi X rồi kiểm chứng."

## Expected
- `check-agent.ts` is run on `fixer.md` and says BLOCKED; `fixer` is not called.
- It explains why and suggests doing the change first and then using mode (b).

## Fail If
- `fixer` is called, or any file is changed.
