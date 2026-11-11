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
- Session A: the beginner shape (see rule TU-006): an everyday analogy first, then plain words, a small example, and only then the technical name; no unexplained jargon, at most 2 new terms.
- Session B: a brief technical example or analogy first, then skips basics and gives the precise mechanism, naming dependency comparison, cleanup timing and synchronization with external systems.
- Both: one main idea, main explanation within the rubric word range (100-300; target 150-250), and neither session asks about level (it is already stated).

## Fail If
- Session B does not name all three of: dependency comparison, cleanup timing, synchronization with external systems; or Session A names any of them without explaining it in plain words.
- Session A uses terms like "dependency array" or "side effect" without explaining them.
- Session B spends most of its text on what a component is or what rendering means.
- Either session asks the owner about level, or exceeds 300 whitespace-separated words.
