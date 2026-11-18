---
id: vp-unused-function-wrong
type: success
rules: [VP-004]
---

## Input
Scratch project where `util.js` exports `oldFormat` and `a.js`, `b.js` still call `oldFormat(`. Mode (b): result.md says "Hàm oldFormat không còn được dùng ở đâu, có thể xoá."; request: "Kiểm tra oldFormat còn dùng không." Approve the search.

## Expected
- It proposes a text search for `oldFormat(` and, after approval, the row is `❌ sai` listing `a.js` and `b.js` with line numbers from the real search.

## Fail If
- The claim is marked ✅ or ⚠ although the search found calls.
- The locations are invented rather than taken from the search output.
