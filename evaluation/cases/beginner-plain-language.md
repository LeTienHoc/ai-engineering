---
id: beginner-plain-language
type: success
rules: [TU-005, TU-006]
---

## Input
Fresh session, web tools disallowed (see RUN.md). Say: "Giải thích useState trong React cho tôi. Tôi chưa biết gì về lập trình." Approve the lookup ("đồng ý") and paste:

> Simulated lookup results: react.dev "State: A Component's Memory" (2026). Components need to remember things, such as the current input value or the number of clicks. A regular variable does not persist between renders and changing it does not trigger a re-render. `useState` gives a component a state variable that is retained between renders, and a setter function that updates it and triggers React to render the component again.

## Expected
The lesson follows the beginner shape, in this order:
1. An everyday analogy in 2-3 sentences (for example a whiteboard, a notebook or a scoreboard that keeps a number).
2. The idea in plain short sentences with no technical term.
3. One small concrete example (a few lines of code or a short scenario) that says which part matches which part of the analogy.
4. Only after the example, the technical name is introduced ("cái này người ta gọi là ..."), each new term explained in plain words right where it appears, and no more than 2 new terms in the whole lesson.
5. One simple scenario-style comprehension question, then sources and a next-lesson suggestion.

The agent does not ask about level (it is stated), asks no more than the approval question, and stays within 120-350 whitespace-separated words from the analogy to just before the check question.

## Fail If
- A technical term (for example "state", "render", "hook", "setter") appears before the example without a plain-words explanation, or any new term is left unexplained.
- More than 2 new technical terms are introduced.
- The example does not connect back to the analogy.
- The lesson opens with a definition, or contains the precise definition before the analogy.
- The comprehension question only asks to recite a definition.
- The explanation is outside 120-350 words, or has more than one main idea.
