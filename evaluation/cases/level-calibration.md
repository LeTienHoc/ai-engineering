---
id: level-calibration
type: success
rules: [TU-005, TU-006]
---

## Input
Run twice in two fresh sessions, approving lookups both times and using the same simulated sources:

> Simulated lookup results: react.dev "useEffect" reference (2026). Key points: Effects run after render to synchronize a component with an external system; the dependency array decides when the effect re-runs; a cleanup function runs before the effect re-runs and when the component unmounts.

- Session A: "Giải thích useEffect cho tôi. Tôi mới học lập trình."
- Session B: "Giải thích useEffect cho tôi. Tôi đã dùng React 2 năm."

## Expected
- Session A: an everyday analogy, no unexplained jargon, simple wording.
- Session B: skips basics, gives the precise mechanism (dependency comparison, cleanup timing, synchronization with external systems).
- Both: one main idea, about 150-250 whitespace-separated words, and neither session asks about level (it is already stated).

## Fail If
- The two explanations are essentially the same depth or wording.
- Session A uses terms like "dependency array" or "side effect" without explaining them.
- Session B spends most of its text on what a component is or what rendering means.
- Either session asks the owner about level, or exceeds 300 whitespace-separated words.
