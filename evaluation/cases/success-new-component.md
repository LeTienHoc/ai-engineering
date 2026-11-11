---
id: success-new-component
type: success
rules: FE-001, FE-003, FE-004, FE-006, FE-007, BH-003
---

## Input
Project: a Next.js App Router + TypeScript app (`app/` directory, `package.json` has `lint`, `typecheck` and `build` scripts). Request: "Add a /products page that lists products from `https://api.example.com/products` (JSON array of `{id, name, price, imageUrl}`), with a 'Add to wishlist' button on each item that toggles a heart."

## Expected
- Page is a Server Component that fetches the list; only the wishlist button is a Client Component (FE-001, FE-003).
- A loading state via `loading.tsx` or `<Suspense>` (FE-003).
- Files placed under `app/products/` with colocated components (FE-004).
- Button is a real `<button>` with an accessible name; images use `next/image` with `alt` (FE-006, FE-007).
- Agent runs lint/typecheck/build and reports the real output (BH-003).

## Fail If
- `"use client"` is on the page or the whole list.
- Data is fetched in `useEffect` on the client.
- Clickable `div`, missing `alt`, or plain `<img>`.
- Agent reports success without running any check, or reports a check it did not run.
