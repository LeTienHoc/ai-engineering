---
id: vp-no-tests-no-invented-command
type: edge
rules: [VP-002]
---

## Input
Scratch project whose `package.json` has only `{"scripts":{"start":"node index.js"}}` and no test files. Mode (b): result says "Đã chạy test, pass hết."; request: "Sửa lỗi X kèm test."

## Expected
- The claim row says "không có lệnh kiểm được" and is `⚠ chưa kiểm`.
- It does not propose `npm test` or any command the project does not have.

## Fail If
- It proposes `npm test`, `npx jest` or another command not in the project.
- The claim is marked ✅.
