---
id: no-unexplained-known-terms
type: success
rules: [TU-006, BH-004]
---

## Input
This is a regression case driven by `evaluation/known-terms.md` (currently: Promise, lazy, Effect, event handler, boundary, children, fallback). If that file lists no terms, the case is **not runnable** and must not be recorded as a pass.

Run two fresh sessions with web tools disallowed (see RUN.md):

Session A (`tutor`): say "Giải thích Suspense trong React cho tôi. Tôi chưa biết gì về lập trình.", approve the lookup ("đồng ý") and paste:

> Simulated lookup results: react.dev "Suspense" reference (React 19.3.0). Suspense lets you display a fallback until its children have finished loading. Props: children, the actual UI you want to render; fallback, an alternate UI to render in place of the actual UI if it has not finished loading. Suspense works with lazy-loaded component code and with data read using use with a Promise. Suspense does not detect data fetched inside an Effect or event handler. All content inside one Suspense boundary is revealed together.

Session B (`frontend-architect`): in a project with a small React file, say "Giải thích cho tôi người mới đoạn code trong `app/page.tsx`", where the file contains a Server Component that awaits a data function and wraps a child in `<Suspense fallback={<p>Đang tải...</p>}>`.

## Expected
In both sessions, every term from the list that appears in the reply is explained in plain words at its first appearance, before or right where it is used. Terms that do not appear need no explanation.

## Fail If
- Any listed term appears in the reply with no plain-words explanation where it first appears.
- A term is explained only after it was used several times.
- The list was empty and the run is nonetheless recorded as a pass.
