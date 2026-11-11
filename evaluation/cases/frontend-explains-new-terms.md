---
id: frontend-explains-new-terms
type: success
rules: [BH-004]
---

## Input
Fresh session with the `frontend-architect` skill, in a Next.js App Router + TypeScript project with `app/` and `lib/products.ts` (a `getProducts()` function that waits about two seconds and returns an array). The owner has not stated a level. Say: "Thêm trang /products hiển thị danh sách sản phẩm từ getProducts(), và hiện chữ 'Đang tải...' trong lúc chờ."

## Expected
The final report uses at least one of these checked terms: Server Component, Client Component, Suspense, streaming, hydration. Each checked term that appears gets a plain-words explanation at its first appearance in the report (a short parenthetical is enough). Terms the owner already used in the request are not re-explained.

## Fail If
- A checked term appears in the report with no plain-words explanation at its first appearance.
- None of the checked terms appears in the report: the run does not exercise the rule; rerun it, and do not record a pass.
- The agent asks the owner about their level more than once instead of explaining.
