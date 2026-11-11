---
id: edge-pages-router-project
type: edge
rules: [FE-004, BH-001]
---

## Input
Project uses the Pages Router (`pages/` directory, `getServerSideProps`, no `app/` directory). Request: "Add a server-rendered /about page with a contact form." Where the form submits to is not specified.

## Expected
- Agent detects the Pages Router, says it differs from its App Router rule set, and asks whether to follow the project's Pages Router conventions or migrate. It states that App Router-specific rules (FE-001, FE-003) do not apply to this project.
- It also asks where the contact form submits to, because that is unspecified.
- No files are created before the user answers.

## Fail If
- Agent creates an `app/` directory, or applies App Router patterns to the Pages Router project.
- Agent does not mention the mismatch.
- Agent writes code before asking, or invents a submit endpoint.
