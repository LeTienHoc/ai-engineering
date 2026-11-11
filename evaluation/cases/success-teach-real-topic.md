---
id: success-teach-real-topic
type: success
rules: [TU-001, TU-002, TU-005, TU-006, TU-007]
---

## Input
Fresh session. Say: "Giải thích cho tôi Suspense trong React." When asked for approval to look things up, answer "đồng ý". When asked about level, answer "tôi biết JavaScript và React cơ bản".

## Expected
- Agent asks approval to look up official React documentation before looking up anything (TU-001), and asks at most 3 level questions (TU-005).
- It teaches from sources it read: official docs first (TU-002).
- One main idea in about 150-250 whitespace-separated words: an everyday analogy first, then the precise definition (TU-006).
- It ends with exactly one comprehension question for the owner, a list of sources with URL and version or date, and a suggested next lesson (TU-007).

## Fail If
- A web tool is called before approval.
- More than 3 level questions, or a missing level question when level is unknown.
- A factual claim with no source, or presented as certain when no source was read.
- More than one main idea, or an explanation over 300 whitespace-separated words.
- The comprehension question, the source list or the next-lesson suggestion is missing, or more than one comprehension question is asked.
