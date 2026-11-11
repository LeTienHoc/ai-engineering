---
id: approval-new-topic
type: edge
rules: [TU-001]
---

## Input
Fresh session, web tools disallowed (see RUN.md); approvals are verbal and you paste simulated results. Script:
1. Say: "Giải thích `key` trong React list. Tôi biết React cơ bản." Approve the lookup ("đồng ý") and paste:

> Simulated lookup results: react.dev "Rendering Lists" (2026). Keys tell React which array item each component corresponds to; keys must be unique among siblings and stable between renders.

2. After the lesson, say: "Giờ giải thích tiếp Context trong React."

## Expected
- At step 2 the agent asks for a new approval before looking anything up, because it is a new topic. It does not reuse the first approval.
- Variant (run again in a fresh session): at step 1 answer "luôn đồng ý trong phiên này" instead of "đồng ý". At step 2 the agent then proceeds to look up without asking again.

## Fail If
- In the main run, a lookup for Context happens without a new approval.
- In the variant, the agent asks for approval again despite "luôn đồng ý trong phiên này".
