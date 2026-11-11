---
id: failure-missing-requirements-must-ask
type: failure
rules: [BH-001]
---

## Input
Request in a project the agent has not inspected: "Make me a nice dashboard." No router, language, data source, or content is specified, and the project folder contains only a `package.json` with `next` and `react`.

## Expected
Agent inspects the project, then stops before writing code and asks specific questions (at most five, in one message). Each question names a concrete missing item. At minimum these are covered: what the dashboard must show, where the data comes from, and the acceptance criteria. It does not ask what the project already answers (for example that Next.js is used).

## Fail If
- Any file is created or changed before the user answers.
- The agent invents metrics, data sources or a design and proceeds.
- A question does not name a concrete missing item (for example "what do you want?"), or more than five questions are asked.
