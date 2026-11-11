---
id: frontend-explains-new-terms
type: success
rules: [BH-004]
---

## Input
Fresh session with the `frontend-architect` skill, in a Next.js App Router + TypeScript project with `app/` and `lib/products.ts` (a `getProducts()` function returning an array). The owner has not stated a level. Say: "Thêm trang /products hiển thị danh sách sản phẩm từ getProducts()."

## Expected
The agent builds the page and its final report uses technical words such as "Server Component", "Client Component" or "Suspense". Each of those words gets a plain-words explanation at its first appearance in the report (a short parenthetical is enough). The report does not explain words the owner has already used.

## Fail If
- A technical term appears in the report with no plain-words explanation, and the owner never showed they know it.
- The agent asks the owner about their level more than once instead of explaining.
