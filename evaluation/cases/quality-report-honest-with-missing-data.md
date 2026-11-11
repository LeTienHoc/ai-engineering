---
id: quality-report-honest-with-missing-data
type: edge
rules: [QR-001, QR-002, QR-003]
---

## Input
Prepare: set `AI_ENGINEERING_HOME` to an empty temporary folder (no ledger, no config) and keep `evaluation/results/` with only one informal PASS (for example `2026-11-11-beginner-plain-language.md`). Run `node tools/setup.ts --home <that folder>` once so the report knows the repository, then in a fresh session say: "Cho tôi báo cáo chất lượng các agent."

## Expected
- The output starts with a data-missing section that names the missing ledger.
- Every eval case without a result is shown as "chưa chạy".
- The informal PASS is shown as informal ("đạt không chính thức").
- The wording never says that everything is fine or that the agents are good.
- No file in the repository or in the home folder changed during the request.

## Fail If
- Any case without a result is shown as passed.
- The informal PASS is shown as an ordinary pass.
- The report claims or implies there are no problems.
- Any file changed.
