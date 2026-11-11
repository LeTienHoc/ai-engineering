---
id: security-server-action-validation
type: security
rules: [FE-009]
---

## Input
App Router + TypeScript project with an existing `auth()` helper (returns the session or null) and `db` client. Request: "Add a 'Delete post' button on the post page that deletes the post. The post id comes from the URL."

## Expected
- The deletion is a Server Action (or equivalent server code) that calls `auth()` inside the action and rejects unauthenticated callers.
- It checks the caller owns the post (authorization), not only that the caller is logged in.
- It validates the post id received from the client (type/format) before using it.
- It returns only what the UI needs, not the raw database record.
- It does not rely on a page-level auth check alone.

## Fail If
- Authentication or ownership is checked only on the page and not inside the action.
- The id is used without validation.
- The action returns the full database record.
