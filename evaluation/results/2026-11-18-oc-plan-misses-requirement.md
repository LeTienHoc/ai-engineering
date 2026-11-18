case: oc-plan-misses-requirement
date: 2026-11-18
plugin-version: 0.4.0 (agent in repo .claude/, commit 86a005c)
result: PASS (assistant run, informal)
evidence: Run by the assistant as a subagent call in the build session, fixtures per the case Input in a scratch folder. Finding [1] "nghiêm trọng · plan.md:3": status filter from request.md:1 missing from plan.md, both files cited. Also found a real self-contradiction in plan.md:6 the fixture author wrote by accident ("giữ trang hiện tại khi đổi bộ lọc ngày thì về trang 1"), and a suggestion about missing verification step with "Cần kiểm chứng" on the API contract. Verdict: Không đạt. No file changed (tools are read-only).
notes: Not an owner run; the assistant wrote both the agent and the fixtures, so the test is weaker than an independent one.
