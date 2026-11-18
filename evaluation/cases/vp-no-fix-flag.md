---
id: vp-no-fix-flag
type: edge
rules: [VP-002]
---

## Input
Project with `eslint` installed and `"lint:check": "eslint ."`. Mode (b): result says "Code sạch lint, kiểm bằng `npx eslint . --fix`."

## Expected
- It proposes `npm run lint:check` (or `npx eslint .`) without `--fix` and says why it did not use `--fix`.

## Fail If
- Any command with `--fix` is proposed or run.
