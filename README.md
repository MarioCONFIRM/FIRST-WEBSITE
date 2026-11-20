# VELTRIX BANK

Phase 002 — Database architecture and implementation. The Phase 001 foundation is preserved.

> **Simulation only.** All money, accounts, transfers, cards, loans and
> payments in Veltrix Bank are simulated demonstration functionality. No real
> funds are processed and no connection to real banking networks exists.

## Status

Phase 001 established the technical foundation and page structure. Phase 002
adds the database schema, migrations, constraints and currency seed only. It
does **not** implement authentication, account generation, deposits,
withdrawals, transfers, transaction execution or administration. Those routes
remain clearly marked placeholders. See [DATABASE.md](DATABASE.md) for the full
database architecture. The written PostgreSQL requirement was adapted to the
existing WAMP MySQL setup with user approval; details are in `DATABASE.md`.

## Technology stack

| Layer      | Technology                                   |
| ---------- | -------------------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19, TypeScript |
| Styling    | Tailwind CSS 4                               |
| Validation | Zod 4                                        |
| Backend    | Next.js Route Handlers, server-only modules  |
| Database   | MySQL 8.4 (local WAMP), Prisma ORM 7 (`@prisma/adapter-mariadb`) |
| Testing    | Vitest 5, React Testing Library              |
| Tooling    | ESLint 9, Git, npm                           |

## Getting started

```bash
npm install
copy .env.example .env   # Windows: edit the password placeholder
npm run prisma:generate
npm run db:check         # confirms the app can reach WAMP MySQL
npx prisma migrate deploy
npm run db:seed          # repeatable GBP/USD/AUD seed
npm run dev
```

Open <http://localhost:3000>. A liveness endpoint is available at
<http://localhost:3000/api/health>; it does not require a running database.

> The pages build without a database, but the project is wired to the local
> WAMP MySQL server. `npm run db:check` proves the connection works; migrations
> and seed data are now applied to `veltrix_bank`.

### Local WAMP connection

The project uses the MySQL 8.4 instance in WAMP on port **3306**:

| Setting | Value |
| --- | --- |
| Database | `veltrix_bank` — 10 domain tables plus Prisma's migration table |
| Shadow database | `veltrix_shadow` — used by Prisma Migrate only |
| User | `veltrix_app` |
| Rights | Read/write/DDL plus `TRIGGER`/`EXECUTE` on `veltrix_bank`; full rights on `veltrix_shadow`; no global admin rights |
| Password | 256-bit random value stored only in the gitignored `.env` |
| Storage engine | InnoDB for all domain tables (foreign keys are enforced) |

The existing `first_website` database and the MariaDB instance on port 3307
were left untouched. WAMP's Apache service is not used — Next.js serves the
application itself.

## Commands

| Command                   | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start the development server             |
| `npm run build`           | Production build                         |
| `npm start`               | Start the production server              |
| `npm run lint`            | Run ESLint                               |
| `npm run typecheck`       | Run TypeScript compiler checks           |
| `npm test`                | Run the test suite once                  |
| `npm run test:watch`      | Run tests in watch mode                  |
| `npm run prisma:validate` | Validate the Prisma schema               |
| `npm run prisma:generate` | Generate the Prisma client               |
| `npm run prisma:migrate`  | Create/apply a development migration     |
| `npm run prisma:migrate:deploy` | Apply committed migrations         |
| `npm run prisma:status`   | Show migration status                    |
| `npm run db:seed`         | Seed GBP, USD and AUD (repeatable)       |
| `npm run db:check`        | Test the real MySQL connection           |

## Environment variables

Copy `.env.example` to `.env`. Both Next.js and the Prisma CLI read `.env`.
Never commit `.env` or real secrets.

| Variable              | Scope  | Required | Purpose                                  |
| --------------------- | ------ | -------- | ---------------------------------------- |
| `DATABASE_URL`        | Server | Yes      | MySQL connection string for Prisma       |
| `SHADOW_DATABASE_URL` | Prisma CLI | Yes   | Separate database used by Prisma Migrate |
| `NODE_ENV`            | Server | No       | Runtime environment (default: development) |
| `LOG_LEVEL`           | Server | No       | Logging verbosity (default: info)        |
| `NEXT_PUBLIC_APP_URL` | Public | No       | Canonical application URL                |
| `NEXT_PUBLIC_APP_NAME`| Public | No       | Display name                             |

Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.
Server secrets are validated in `src/lib/env.ts`, which is guarded by
`server-only`.

## Folder structure

```
veltrix-bank/
├── prisma/                  # Schema, migrations and repeatable currency seed
├── public/                  # Static assets
├── src/
│   ├── app/                 # App Router pages and API endpoints
│   │   ├── (public)/        # Marketing and policy pages
│   │   ├── (customer)/      # Customer area placeholders
│   │   ├── (admin)/         # Administration placeholders
│   │   └── api/health/      # Liveness endpoint
│   ├── auth/                # Reserved for future authentication
│   ├── components/          # Reusable brand, layout and UI components
│   ├── config/              # App, navigation and currency configuration
│   ├── generated/prisma/    # Generated client (gitignored)
│   ├── lib/                 # Environment, Prisma and utility helpers
│   ├── server/services/     # Reserved for backend services
│   ├── types/               # Shared TypeScript types
│   └── validation/          # Shared Zod schemas
├── scripts/                 # Database diagnostic scripts
└── tests/                   # Unit and component tests
```

Supported currencies: GBP (British Pound), USD (United States Dollar) and AUD
(Australian Dollar). These are seeded by `npm run db:seed`. Exchange rates are
intentionally empty; conversion is a later phase. Full schema, relationship,
constraint and verification details are in [DATABASE.md](DATABASE.md).

### Dependency note

Prisma 7 pins `effect@3.20.0`, which is affected by advisory
[GHSA-7589-6fvf-x4pw](https://github.com/advisories/GHSA-7589-6fvf-x4pw).
`package.json` contains an `overrides` entry pinning `effect@3.22.5`, the
patched release in the same major/minor line. Keep this override: removing it
reintroduces the advisory, and npm's suggested "fix" would downgrade Prisma to
6.12.0. `npm audit` reports 0 vulnerabilities with the override in place.

See `AGENTS.md` for the global Veltrix Bank development rules.
