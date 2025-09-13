# Repository Guidelines

## Project Structure & Module Organization
- `app/` — Next.js App Router routes, layouts, and server actions.
- `components/` — Reusable UI components; co-locate styles when practical.
- `lib/`, `constants/` — Utilities and shared constants.
- `db/`, `drizzle/` — Database client/config and Drizzle SQL migrations (`drizzle/migrations`).
- `public/` — Static assets served at the site root.
- `types/` — Shared TypeScript types.
- `scripts/` — Local tooling (e.g., `init-dev-db.js`).
- Key configs: `next.config.js`, `tailwind.config.js`, `eslint.config.mjs`, `wrangler.jsonc`, `open-next.config.ts`, `.env`.

## Build, Test, and Development Commands
- `npm run dev` — Start Next.js dev server.
- `npm run dev:db` — Initialize local SQLite (`dev.db`) from Drizzle migrations.
- `npm run dev:setup` — Initialize DB, then start dev server.
- `npm run build` / `npm start` — Production build and serve.
- `npm run lint` — Lint with ESLint (Next.js config).
- `npm run deploy` / `npm run preview` — Build + deploy/preview via OpenNext Cloudflare.
- `npm run cf-typegen` — Generate Cloudflare env types.
- `npm run db:generate` / `npm run db:push` — Drizzle generate/migrate.

## Coding Style & Naming Conventions
- TypeScript, ESM, 2‑space indentation.
- Components: `PascalCase` filenames; hooks: `useX.ts` in `lib/` or alongside usage.
- Prefer functional, small, composable components; Tailwind for styling.
- Run `npm run lint` and address errors before committing.

## Testing Guidelines
- No test runner is configured yet. If adding tests, prefer Vitest + React Testing Library.
- Name tests `*.test.ts(x)` and co‑locate near the unit under test.
- Aim for critical path coverage (auth, data ops, routes) and keep tests deterministic.

## Commit & Pull Request Guidelines
- Follow concise, present‑tense messages (Japanese/English OK), e.g., "APIエラーを解消" / "Fix API error".
- Reference issues (`#123`) and scope changes clearly.
- PRs include: short description, screenshots for UI changes, steps to validate, and any DB migration notes.
- Ensure `npm run lint` and `npm run build` pass; run `npm run dev:db` if schema changed.

## Security & Configuration Tips
- Keep secrets in `.env` (local) and Cloudflare vars via `wrangler.jsonc`; never hard‑code.
- Regenerate env types after changes: `npm run cf-typegen`.
- `dev.db` is local only; do not commit real data.
