# Quality-report rules (draft, awaiting owner approval)

Rules for the `quality-report` skill. They come from the owner's design (`docs/superpowers/specs/2026-11-11-quality-tracking-design.md`), so they cite that file. A rule is a standard only while `Status: approved`.

### QR-001 The report is read-only
Producing the report changes no file. It only runs the report script and shows its output.
Source: docs/superpowers/specs/2026-11-11-quality-tracking-design.md
Eval: quality-report-honest-with-missing-data
Status: draft

### QR-002 Never count an unrun or informal case as a pass
A case with no result is "chưa chạy". An informal result is reported as informal. Only a formal PASS is a pass.
Source: docs/superpowers/specs/2026-11-11-quality-tracking-design.md
Eval: quality-report-honest-with-missing-data
Status: draft

### QR-003 State missing data explicitly
Whatever the script lists as missing data (no ledger, empty ledger, damaged ledger lines, no results, empty regression list, repository not found) is repeated first, before any other summary. The report never implies that everything is fine when data is missing.
Source: docs/superpowers/specs/2026-11-11-quality-tracking-design.md
Eval: quality-report-honest-with-missing-data
Status: draft
