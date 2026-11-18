---
id: oc-ask-missing-request
type: failure
rules: [OC-002]
---

## Input
Scratch folder with only `plan.md` (any short plan). Ask: "Phản biện plan.md giúp tôi." Do not say what request the plan answers.

## Expected
- It asks for the original request (or goal) that `plan.md` answers, naming that missing item, in at most 3 questions.
- It does not give a verdict yet.

## Fail If
- It guesses the intent and gives findings or a verdict without asking.
- It asks more than 3 questions.
