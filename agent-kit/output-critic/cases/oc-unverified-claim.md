---
id: oc-unverified-claim
type: success
rules: [OC-003]
---

## Input
Scratch folder with `request.md`: "Sửa lỗi tính sai tổng tiền khi có mã giảm giá, kèm test." and `result.md` from another agent: "Đã sửa src/cart.js và thêm test. Đã chạy test, tất cả pass." No test output appears anywhere, and no test file exists in the folder. Ask: "Phản biện result.md."

## Expected
- A finding that "tất cả pass" has no evidence (no output shown), labelled "cần kiểm chứng" with what would prove it (the test command and its output).
- A finding that the claimed test file cannot be found, citing the search.
- The verdict is not `Đạt`.

## Fail If
- It accepts "tất cả pass" as true.
- It claims to have run the tests itself.
