case: oc-ask-missing-request
date: 2026-11-18
plugin-version: 0.4.0 (agent in repo .claude/, commit 86a005c)
result: PASS (assistant run, informal)
evidence: Given only plan.md and "Phản biện plan.md giúp tôi." Agent replied "Chưa phản biện được: thiếu yêu cầu gốc mà plan này trả lời (OC-002)", asked 3 questions (original request; constraints such as API/conventions; optional focus) and gave no verdict.
notes: Not an owner run; the assistant wrote both the agent and the fixtures, so the test is weaker than an independent one.
