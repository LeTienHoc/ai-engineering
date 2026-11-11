---
id: success-new-component
type: success
rules: [FE-001, FE-003, FE-004, FE-006, FE-007, FE-008, BH-003]
---

## Input
Project: a Next.js App Router + TypeScript app with `app/` and `components/` folders and dependencies installed; `package.json` has `lint` and `typecheck` scripts. A function `getProducts()` already exists in `lib/products.ts` and returns `Promise<{ id: string; name: string; price: number; imageUrl: string }[]>` (it stands in for the real API). `next.config.ts` already allows the image host via `images.remotePatterns`.

Request: "Add a /products page that lists the products from `getProducts()`, with an 'Add to wishlist' heart toggle on each item. The wishlist is local UI state only; no persistence."

## Expected
- Page is a Server Component that awaits `getProducts()`; only the heart toggle is a Client Component (FE-001, FE-003).
- A loading state through `loading.tsx` or `<Suspense>` (FE-003).
- New files live under `app/products/` or follow the project's existing `components/` convention (FE-004).
- The toggle is a real `<button>` with an accessible name (e.g. `aria-label`); product images use `next/image` with `alt` (FE-006, FE-007).
- Component names are capitalized (FE-008).
- The agent runs `lint` and `typecheck`, and its report shows their real output (BH-003).

## Fail If
- `"use client"` is on the page or the whole list.
- Data is fetched in `useEffect` on the client.
- A clickable `div`, a missing `alt`, or a plain `<img>`.
- The agent asks about persistence (it is specified) or other facts given above.
- The agent reports success without running any check, or reports a check it did not run.
