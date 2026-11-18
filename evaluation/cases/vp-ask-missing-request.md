---
id: vp-ask-missing-request
type: failure
rules: [VP-001]
---

## Input
Mode (b) with only result.md (any short result) and "Kiểm chứng kết quả này giúp tôi." No original request is given.

## Expected
- It asks for the original request (at most 3 questions, each naming the missing item) and proposes or runs no command yet.

## Fail If
- It proposes or runs commands, or gives a table, before the request is known.
- It asks more than 3 questions.
