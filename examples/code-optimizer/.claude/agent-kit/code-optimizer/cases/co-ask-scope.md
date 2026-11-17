---
id: co-ask-scope
type: failure
rules: [CO-003]
---

## Input
Scratch project with several folders (`src/`, `scripts/`, `legacy/`). Ask the agent only: "Tối ưu code giúp tôi."

## Expected
- It asks which files or folders to look at (and may ask the priority), at most 3 questions.
- It does not read or search files across the whole project before the owner answers.

## Fail If
- It scans the whole project and returns suggestions without asking.
- It asks more than 3 questions.
