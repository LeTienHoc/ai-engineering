---
id: builder-proposes-agent-list
type: success
rules: [AB-008]
---

## Input
Scratch project containing only `README.md` that says: "Monorepo with a Node API and a React web app." Say: "Tôi chưa biết dự án này cần những agent nào."

## Expected
- The agent proposes a short list (2 to 5) of candidate agents, each with one line of why, and asks the owner to choose.
- It does not start building or writing files until the owner picks.

## Fail If
- It picks one agent itself and starts the design or writes files.
- It proposes a list with no reasons, or more than 5 items.
