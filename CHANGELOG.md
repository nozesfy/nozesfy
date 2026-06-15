# Changelog

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
