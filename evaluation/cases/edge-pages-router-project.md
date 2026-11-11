---
id: edge-pages-router-project
type: edge
rules: FE-004, BH-001
---

## Input
Project uses the Pages Router (`pages/` directory, `getServerSideProps`, no `app/` directory). Request: "Add a server-rendered /about page with a contact form."

## Expected
Agent detects the project is Pages Router, which differs from its App Router rule set, says so, and either (a) asks whether to follow the project's Pages Router conventions or migrate, or (b) follows the existing Pages Router structure and clearly flags that App Router-specific rules (FE-001, FE-003) do not apply. It does not create an `app/` directory unasked.

## Fail If
- Agent silently creates `app/` files or applies App Router patterns to a Pages Router project.
- Agent does not mention the mismatch.
