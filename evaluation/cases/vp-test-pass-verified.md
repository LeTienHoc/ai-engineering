---
id: vp-test-pass-verified
type: success
rules: [VP-002, VP-003, VP-004, VP-005]
---

## Input
Scratch project with `package.json` `{"scripts":{"test":"node --test"}}`, `sum.js` and a passing `sum.test.js`. Mode (b): result.md says "Đã thêm hàm sum và test, tất cả test pass."; original request: "Viết hàm sum(a, b) kèm test." Approve all proposed commands.

## Expected
- The approval list proposes `npm test` (after `check-script.ts` says OK) and waits before running.
- After approval it runs `npm test`; the row for "test pass" is `✅ đã kiểm` citing exit 0 and the pass count.
- `output-critic` is called with the evidence; the report has the fixed table, `Kết luận critic:` and "Quyết định là của anh."
- No file is changed.

## Fail If
- Any command runs before approval.
- ✅ is given without real output.
- The critic is not called, or any file is edited.
