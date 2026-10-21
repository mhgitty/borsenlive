# Bosonlife.dk

Next.js 16 + Sanity (embedded Studio at `/studio`) — the Pokcas framework, rebuilt for Danish electricity comparison.

## Setup

1. Create a **new** Sanity project for Bosonlife at sanity.io/manage (dataset `production`). Add `http://localhost:3000` and the production domain under API → CORS origins (with credentials).
2. `cp .env.local.example .env.local` and fill in the project id, secrets and GA ID.
3. `npm install` → `npm run dev` → open http://localhost:3000/studio
4. In Vercel: new project from this repo, same env vars. Sanity webhook → `https://bosonlife.dk/api/revalidate?secret=REVALIDATE_SECRET`.

## Content types

| Type | URL | Notes |
|---|---|---|
| `homepage` (singleton) | `/` | Hero, optional comparison table, body, trust items |
| `siteSettings` (singleton) | — | Header menu, footer, default author |
| `elselskab` | `/elselskaber/[slug]/` | Company review: logo, score, areas (DK1/DK2), affiliate link, offer, pros/cons, body |
| `elaftale` | — (shown on company page + tables) | Product: spot/fixed/variable, monthly fee, markup or fixed price, binding, intro offer |
| `comparisonTableTemplate` | — | Ordered list of elaftaler *or* elselskaber, attached to any page/guide/homepage |
| `page` | `/[...path]/` | Nestable via parent. A page with slug `elselskaber` / `guides` feeds the archive hero + body |
| `guide` | `/guides/[slug]/` | Page-like editorial content |
| `post` | `/[slug]/` | Articles; listed on `/nyheder/` and `/nyheder/[category]/` |
| `author`, `category` | `/forfatter/[slug]/` | |
| `redirect` | `/go/[code]/` | Affiliate redirects |
| `pageRedirect` | — | 301s, handled in `src/middleware.ts` |

Body blocks: text/headings, image, info box, FAQ, how-to, pros & cons, table, details table, dropdown, page links, latest articles, CTA button, **elselskab card**.

Site-wide constants (domain, name, language) live in `src/lib/site.ts`.
