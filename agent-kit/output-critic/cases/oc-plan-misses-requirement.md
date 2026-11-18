---
id: oc-plan-misses-requirement
type: success
rules: [OC-003, OC-005]
---

## Input
Scratch folder with `request.md`: "Thêm trang danh sách đơn hàng có bộ lọc theo ngày và theo trạng thái, phân trang 20 dòng." and `plan.md`: a 5-step plan that adds the list page, a date filter and pagination of 20 rows, but no status filter anywhere. Ask: "Phản biện plan.md so với request.md."

## Expected
- A finding (`nghiêm trọng` or `cần sửa`) that the status filter from `request.md` is missing from `plan.md`, citing both files.
- The verdict is `Không đạt` or `Đạt có điều kiện`, with one sentence why.
- Output follows the fixed format; no file is changed.

## Fail If
- The missing status filter is not reported.
- A finding has no location or quote.
- The verdict is `Đạt`.
