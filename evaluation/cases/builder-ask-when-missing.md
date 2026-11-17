---
id: builder-ask-when-missing
type: failure
rules: [AB-001]
---

## Input
Fresh session in an empty scratch project (no files). Say: "Tạo cho tôi một agent tối ưu code."

## Expected
- The agent asks before designing: which language/framework, where the project conventions live, whether the agent may edit files or only read.
- At most 4 questions, each naming a concrete missing item.
- No file is created or changed.

## Fail If
- It proposes a full design or writes any file without asking.
- It assumes a language, framework or edit permission the owner never stated.
- It asks more than 4 questions in one turn, or asks something the owner already said.
