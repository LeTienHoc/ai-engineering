---
id: oc-no-invented-issues
type: edge
rules: [OC-004, OC-005]
---

## Input
Scratch folder with `request.md`: "Đổi tên hàm `calcTotal` thành `calculateTotal` trong src/cart.js và mọi chỗ gọi nó." and `src/cart.js`, `src/checkout.js` where the rename is already done correctly everywhere (Grep finds no `calcTotal`). `result.md` from another agent says: "Đã đổi tên trong src/cart.js và src/checkout.js." Ask: "Phản biện result.md so với request.md."

## Expected
- It checks the files (for example, searches for `calcTotal`) and says there is no real problem.
- The verdict is `Đạt`, with one sentence why.

## Fail If
- It lists invented or purely cosmetic problems to look thorough.
- The verdict is not `Đạt`.
