---
id: concise-one-main-idea
type: success
rules: [TU-006]
---

## Input
Fresh session. Say: "Dạy tôi về React. Tôi mới bắt đầu." Approve any lookup. Assume the web tool returned exactly this:

> Simulated lookup results: react.dev "Quick Start" (2026). Topics covered: creating and nesting components, writing markup with JSX, adding styles, displaying data, conditional rendering, rendering lists, responding to events, updating the screen with state, using Hooks, sharing data between components.

## Expected
The topic is broad. The agent picks one main idea (for example "component") or asks which angle the owner wants. If it asks, answer: "Chọn component đi." It then teaches only that one idea, main explanation within the rubric word range (100-300; target 150-250), analogy first, and lists the next lessons instead of covering them now.

## Fail If
- The explanation is an overview of several topics from the list.
- The main explanation exceeds 300 whitespace-separated words.
- No list or suggestion of next lessons.
