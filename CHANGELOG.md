# Changelog

## v2.1.0 (2026-06-15)

- Deploy compatível com Cloudflare Pages (`@cloudflare/next-on-pages`)
- DB driver: `postgres` → `@neondatabase/serverless` + `drizzle-orm/neon-http` (HTTP-based)
- Auth: `bcryptjs` → Web Crypto API (PBKDF2) — compatível com Workers
- Criado `wrangler.toml` com `nodejs_compat`
- Criado `lib/crypto.ts` com hash/verify via PBKDF2

## v2.0.0 (2026-06-15)

- **BREAKING**: Migrado banco de SQLite para PostgreSQL (Supabase)
- Schema refatorado para `pgTable` com tipos PostgreSQL e `uuid`/`jsonb`
- Conexão via `drizzle-orm/postgres-js` com `DATABASE_URL`
- Removido `better-sqlite3` e `@types/better-sqlite3`
- Adicionado `postgres` driver
- Criado `.env.example` com `DATABASE_URL`
- `sqlite.db` removido do tracking e adicionado ao `.gitignore`
- Criada branch `sqlite` para versão legada com SQLite

## v1.0.2 (2026-06-15)

- Adicionado SEO completo: OG tags, Twitter Card, viewport, JSON-LD, canonical URL
- Criado `app/sitemap.ts` com 7 rotas públicas
- Criado `app/robots.ts` bloqueando `/dashboard/` e `/api/`

## v1.0.1 (2026-06-15)

- Atualizado `.gitignore` com patterns para TypeScript, Python, IDE, Drizzle
- Removido `AGENTS.md` do tracking e adicionado ao `.gitignore`
- Removida referência ao `AGENTS.md` do `README.md`

## v1.0.0 (2026-06-15)

- Removed `aplicativo/` subfolder — app movido para raiz do repositório
- Removidos artefatos de build: `build/`, `dist/`, `public/nozesfy.exe`
- Removidos arquivos de desenvolvimento: `scratch/`, `doc/`, `pagina provisoria/`
- Removidas migrações SQLite (`drizzle/`) — uso futuro Supabase
- Removido `.github/` (CI obsoleto para Pages)
- Removidos `main.spec`, `metadata.json` (desktop build config)
- Corrigido `ReferenceError: Navbar is not defined` em `app/planos/page.tsx`
- Corrigida lentidão no Navbar — AuthProvider não bloqueia mais a UI
- Criados `AGENTS.md` e `CHANGELOG.md`
- Atualizado `README.md` com estrutura atual e comandos corretos

## 2026-04-30

- Added detailed explanatory comments to server actions (`lib/actions/`) and React components

## 2026-04-29

- Added detailed comments to all main files (Portuguese)
- Removed `wrangler.toml` from version control
- Moved all Next.js app files into `aplicativo/` subfolder
- Created AGENTS.md instruction file
- Updated root `index.html` (hub page) and `README.md`
- Reorganized documentation: removed redundant doc files, fixed formatting
- Updated logo from PNG to WEBP format

## 2026-04-28

- Repository setup and initial file uploads
- Created GitHub Actions workflow for Pages deployment (`static.yml`)
- Set up `index.html` as root hub page
- Updated `README.md`

## 2026-04-08

- Initial documentation structure: `INDICE.md`, `regras_de_negocio.md`, and requirements docs
