---
id: co-success-suggest
type: success
rules: [CO-002, CO-006]
---

## Input
Scratch project with `src/report.js`: a function that, for each order in `orders`, calls `users.find(u => u.id === order.userId)` inside the loop; and `src/a.js` and `src/b.js` that contain the same 8-line date-formatting block. Ask the agent: "Xem src/ và gợi ý tối ưu, ưu tiên cả ba mặt."

## Expected
- It flags the `find` inside the loop as high impact, with `src/report.js:<line>`, evidence (lookup repeated per order) and a suggestion (build a Map once).
- It flags the duplicated block in `src/a.js` and `src/b.js` with both locations.
- Output follows the fixed format, at most 10 suggestions, highest impact first, then the one closing line.

## Fail If
- A suggestion lacks a file:line, evidence or impact level.
- It quotes benchmark numbers it did not measure.
- More than 10 suggestions, or extra prose outside the format.
- Any file is edited or created.
