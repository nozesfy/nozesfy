# Nozesfy — AGENTS.md

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | TypeScript typecheck (no npm script) |
| `npx drizzle-kit push` | Push schema to DB (no migration files) |

Migrações SQLite foram removidas (migrando para Supabase futuramente). Use `push` para sincronizar o schema.

## Key facts

- **No test framework** exists.
- **`sqlite.db` is versioned** (not in .gitignore).
- **Auth is custom** (JWT HS256 + bcrypt + httpOnly cookies). No NextAuth/Supabase.
  - Server actions in `lib/actions/auth.ts`.
  - `AuthProvider` in `components/AuthProvider.tsx` provides context.
- **Tailwind CSS v4** via `@tailwindcss/postcss`. Custom theme tokens (brand/primary).
- **Path alias:** `@/*` → `./*`
- **`DISABLE_HMR=true`** disables file watching (AI Studio). Set during dev to prevent flickering during agent edits.
- **ESLint:** `eslint.config.mjs` (flat config) takes precedence over `.eslintrc.json`.
- **Landing page auth modal:** `?auth=login` query param. `onAuthClick` → `window.location.href = '/?auth=login'`.
- **Dashboard layout** (`app/dashboard/layout.tsx`) has its own sidebar and auth guard.

## Database

- SQLite via `better-sqlite3` + Drizzle ORM 0.45.
- Schema: `lib/db/schema.ts`. Connection: `lib/db/index.ts`.
- No migration files — use `npx drizzle-kit push` to sync.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | JWT signing key |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID` | Stripe price ID for Pro plan |
| `NEXT_PUBLIC_STRIPE_ENTERPRISE_PLAN_PRICE_ID` | Stripe price ID for Enterprise plan |
| `DISABLE_HMR` | Set to `true` to disable file watching |

## Desktop app (Python)

- Wrapper: `tkinter/main.py` (PyWebView). Not relevant for frontend/backend work.

## Other

- **CI:** Only GitHub Pages for the static content. No auto-deploy for Next.js.
- Icon library: `lucide-react`. Animation: `motion` (Framer Motion). PDF: `jsPDF`.
- Stripe via `lib/actions/stripe.ts` and `app/api/webhooks/stripe/route.ts`.
