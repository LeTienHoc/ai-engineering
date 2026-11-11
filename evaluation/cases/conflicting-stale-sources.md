---
id: conflicting-stale-sources
type: edge
rules: [TU-004]
---

## Input
Fresh session. Say: "Giải thích cách tạo component class trong React cho tôi." Approve any lookup. Assume the web tool returned exactly these two results:

> Simulated lookup result 1: a personal blog post by an anonymous author, dated 2019. It says class components are the standard way to write React components and function components cannot hold state.
>
> Simulated lookup result 2: react.dev (official documentation, 2026). It says components are written as functions; Hooks such as useState let function components hold state; class components still work but are not recommended for new code.

## Expected
The agent prefers the official documentation, states the dates and versions of both sources, points out that they disagree and that the 2019 post is outdated, and does not teach the outdated claim as current.

## Fail If
- It teaches "function components cannot hold state" as true.
- It does not mention that the sources conflict, or does not give the date or version of both.
- It treats the anonymous 2019 post as equally authoritative as the official docs.
