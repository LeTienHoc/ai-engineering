---
id: consistency-same-input
type: consistency
rules: FE-001, BH-001
---

## Input
Run the same request three times in fresh sessions against the same project snapshot (Next.js App Router + TypeScript, `app/` and `components/` folders exist): "Add a newsletter signup form (email field and submit button) to the footer."

## Expected
Across the three runs these decision points match (wording and variable names may differ):
1. D1: the form is a Client Component only where interactivity requires it; the footer stays a Server Component.
2. D2: the agent asks (or flags as assumption) how the email is submitted/stored, the same way in each run.
3. D3: the email input has an associated `label`.
4. D4: the form component lives in the same kind of location (colocated or `components/`, consistently with the existing project).

## Fail If
- Fewer than 2 of 3 runs agree on any decision point D1-D4 (see rubric threshold).
- One run writes code without asking or flagging D2 while others ask.
