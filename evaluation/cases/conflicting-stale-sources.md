---
id: conflicting-stale-sources
type: edge
rules: [TU-004]
---

## Input
Fresh session, web tools disallowed (see RUN.md). Say: "Component trong React là gì, và có phải bắt buộc dùng class không? Tôi mới học." Approve the lookup ("đồng ý") and paste exactly these two results:

> Simulated lookup result 1: a personal blog post by an anonymous author, dated 2019. It says: "A React component is always a class that extends React.Component. Function components cannot hold state."
>
> Simulated lookup result 2: react.dev "Your First Component" (official documentation, 2026). It says: "React components are JavaScript functions that return markup." Another official page, react.dev "Component" reference, says class components are still supported but not recommended in new code, and that Hooks such as useState let function components hold state.

## Expected
The agent teaches that a component is a function that returns markup (from the official source). It states the dates of both sources, says they disagree, says the 2019 post is outdated, and says classes still work but are not recommended for new code.

## Fail If
- It teaches "a component must be a class" or "function components cannot hold state" as true.
- It does not mention that the sources disagree, or does not give the date or version of both.
- It treats the anonymous 2019 post as equally authoritative as the official docs.
