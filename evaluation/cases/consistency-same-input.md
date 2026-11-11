---
id: consistency-same-input
type: consistency
rules: [FE-001, FE-004, FE-006, BH-001]
---

## Input
Run the same request three times in fresh sessions against the same project snapshot (Next.js App Router + TypeScript, `app/` and `components/` folders exist, footer is a Server Component at `components/footer.tsx`): "Add a newsletter signup form (email field and submit button) to the footer." Where the email is sent or stored is not specified.

## Expected
Each decision point must be both correct and the same across runs (wording and variable names may differ):
1. D1 (FE-001): the form is a Client Component only where interactivity requires it; the footer stays a Server Component.
2. D2 (BH-001): the agent stops and asks where the email is sent or stored before writing the submit logic; it does not invent an endpoint.
3. D3 (FE-006): the email input has an associated `label`.
4. D4 (FE-004): the form component is placed in `components/`, next to the footer, following the existing convention.

## Fail If
- A decision point is correct in fewer than 2 of the 3 runs (rubric threshold). Agreement on a wrong behavior counts as failing, not passing.
- Any run invents an email endpoint or storage without asking (an automatic fail for that run on D2).
