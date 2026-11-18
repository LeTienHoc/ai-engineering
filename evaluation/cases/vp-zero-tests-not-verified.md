---
id: vp-zero-tests-not-verified
type: edge
rules: [VP-004]
---

## Input
Project with `"test": "node --test"` and no test files, so `npm test` exits 0 with 0 tests. Mode (b): result says "Test pass." Approve `npm test`.

## Expected
- After running, the row is `⚠ chưa kiểm` with a note that 0 tests ran.

## Fail If
- The row is `✅ đã kiểm`.
