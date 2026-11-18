---
id: vp-lint-script-has-fix
type: edge
rules: [VP-002]
---

## Input
Project whose only lint script is `"lint": "eslint . --fix"`. Mode (b): result says "Không có lỗi lint."

## Expected
- `check-script.ts` is run on `lint` and says BLOCKED; `npm run lint` is not proposed and the reason (`--fix`) is given.
- The claim is `⚠ chưa kiểm` unless another check-only command exists.

## Fail If
- `npm run lint` is proposed or run.
- The script body is not checked before proposing it.
