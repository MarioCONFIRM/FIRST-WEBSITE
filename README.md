# Veltrix Bank

A full-stack **simulated digital banking** web application built with Next.js, TypeScript, Tailwind CSS, and Prisma on MySQL/MariaDB. Veltrix Bank demonstrates secure, database-backed banking workflows in a **non-production, demonstration-only** environment.

> [!IMPORTANT]
> **Simulation only.** All money, accounts, balances, transactions, cards, loans, and payments in Veltrix Bank are demonstration data/functionality. **No real funds are processed**, and there is **no connection** to real banking, card, or payment networks.

---

## Table of contents

- [Overview](#overview)
- [Key features](#key-features)
- [Tech stack](#tech-stack)
- [Project status](#project-status)
- [Architecture overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Database](#database)
- [Security and simulation notes](#security-and-simulation-notes)
- [Quality checks](#quality-checks)
- [Troubleshooting](#troubleshooting)
- [Known limitations and roadmap](#known-limitations-and-roadmap)
- [Development guidelines](#development-guidelines)
- [Additional documentation](#additional-documentation)

---

## Overview

Veltrix Bank is developed incrementally in phases. The current codebase includes a public website, authentication and account-access flows, and a **read-only authenticated customer dashboard** backed by real database records, while preserving a foundation for future simulated banking capabilities.

The project emphasizes:
- **Server-side security boundaries** (authentication, authorization, ownership checks)
- **Database integrity** (Prisma schema/migrations, relational constraints, append-only/audit-oriented foundations)
- **Clear simulation boundaries** (no real-money operations)

## Key features

### Public experience
- Marketing and informational pages (e.g. personal/business banking, about, contact, services, terms/privacy/security pages)
- Core public routes and shared branding/layout components

### Authentication and access control
- Customer registration, login, and logout
- Email verification and password reset flows (email delivery depends on SMTP configuration)
- Server-side session handling (HTTP-only cookie-based sessions)
- Route protection and role/authorization guards for authenticated/customer/admin areas

### Customer dashboard (read-only)
- Authenticated dashboard overview
- Accounts list and account detail views (ownership-scoped)
- Transaction history views with server-validated filters/pagination and URL-state handling
- Profile and security pages
- Client-side balance visibility controls (UI privacy toggle), without exposing unauthorized data

### Administration (limited)
- Admin route area/placeholders
- CLI-only initial administrator bootstrap script (`npm run admin:bootstrap`) — **not exposed via public UI**

### Platform foundations
- Prisma 7 schema, migrations, and repeatable currency seeding
- MySQL/MariaDB integration (local WAMP-compatible setup supported)
- Supported currencies seeded: **GBP, USD, AUD** (handled separately; no cross-currency totalization)

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Validation | [Zod 4](https://zod.dev/) |
| Database & ORM | MySQL 8.x / MariaDB-compatible, [Prisma 7](https://www.prisma.io/) (`@prisma/client`, `@prisma/adapter-mariadb`) |
| Authentication/security utilities | Argon2 password hashing (`@node-rs/argon2`), `server-only`, server-side session/cookie handling |
| Email (optional) | [Nodemailer](https://nodemailer.com/) for SMTP-based delivery when configured |
| Testing | [Vitest](https://vitest.dev/), Testing Library, [Playwright](https://playwright.dev/) (dev tooling/scripts) |
| Tooling | ESLint, tsx, npm |

## Project status

- **Current state:** Incremental delivery through completed Phase 005 acceptance work (read-only authenticated customer dashboard and related verification), preserving earlier phase foundations.
- **Scope boundary:** This repository does **not** currently implement real banking integrations or financial mutation features (e.g. deposits, withdrawals, transfers, currency conversion, payments, funding, balance adjustments, transaction creation/reversal/ledger mutation).
- **Future work:** Any later phases must remain **simulated only** and comply with project rules for security, authorization, auditability, and financial integrity.

## Architecture overview

- **App Router structure:** routes organized under `src/app/` (public, customer, admin, and API segments)
- **Server-first data access:** database reads/writes and sensitive operations are handled in server-side modules/actions/routes (not from untrusted client input)
- **Configuration & validation:** environment and schema validation in server-only modules (e.g. `src/lib/env.ts`, `src/lib/env.schema.ts`)
- **Database access:** Prisma Client with MariaDB adapter configured for MySQL-compatible environments (see `src/lib/prisma.ts`, `prisma7.config.ts`)
- **Domain modeling:** relational schema and migrations managed in `prisma/` with repeatable currency seeding

For detailed schema, constraints, and migration notes, see [DATABASE.md](DATABASE.md).

## Prerequisites

- **Node.js** (LTS recommended) and **npm**
- **MySQL 8.x / MariaDB-compatible server** (local WAMP MySQL is a supported development setup)
- Ability to create and access:
  - an **application database** (e.g. `veltrix_bank`)
  - a **shadow database** for Prisma Migrate diffing (e.g. `veltrix_shadow`)

## Getting started

### 1. Install dependencies
```bash
npm install
```

### 2. Create and configure your environment file
```bash
# Windows (PowerShell / Command Prompt)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```
Edit `.env` with valid local values (at minimum database URLs). **Never commit `.env` or real secrets.**

### 3. Generate the Prisma client
```bash
npm run prisma:generate
```

### 4. Verify database connectivity
Ensure your MySQL/MariaDB service is running, then:
```bash
npm run db:check
```

### 5. Apply migrations and seed reference data
```bash
npx prisma migrate deploy
npm run db:seed
```
`db:seed` seeds supported currencies (GBP, USD, AUD) and is designed to be repeatable.

### 6. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 7. Optional checks
- **Liveness endpoint:** [http://localhost:3000/api/health](http://localhost:3000/api/health) (does not require database connectivity)
- **Initial admin bootstrap (CLI only, when needed):** configure `ADMIN_BOOTSTRAP_*` variables temporarily, then run:
  ```bash
  npm run admin:bootstrap
  ```
  Remove or rotate bootstrap secrets after use.

## Environment configuration

Copy `.env.example` to `.env`. Next.js and Prisma CLI read from `.env`.

### Core variables

| Variable | Scope | Required | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Server / Prisma | Yes | MySQL connection string for the application database |
| `SHADOW_DATABASE_URL` | Prisma CLI | Yes (for migrations) | Separate database used by Prisma Migrate diffing (no app data) |
| `NODE_ENV` | Server | No | Runtime environment (`development`, `test`, `production`) |
| `LOG_LEVEL` | Server | No | Logging verbosity (`debug` \| `info` \| `warn` \| `error`, default: `info`) |
| `NEXT_PUBLIC_APP_URL` | Public | No | Canonical/base application URL (safe for browser exposure) |
| `NEXT_PUBLIC_APP_NAME` | Public | No | Public display name (safe for browser exposure) |

### Email delivery (optional)

Used for verification/reset emails when configured. **If SMTP is not fully configured, the application must not claim that an email was delivered.**

| Variable | Scope | Required | Description |
| --- | --- | --- | --- |
| `SMTP_HOST` | Server | Optional | SMTP server host |
| `SMTP_PORT` | Server | Optional | SMTP server port |
| `SMTP_SECURE` | Server | Optional | TLS/secure mode flag (`true`/`false`) |
| `SMTP_USER` | Server | Optional | SMTP username |
| `SMTP_PASSWORD` | Server | Optional | SMTP password/secret |
| `SMTP_FROM` | Server | Optional | Sender identity/address |
| `APP_BASE_URL` | Server | Optional | Base URL for auth links (defaults to `NEXT_PUBLIC_APP_URL`) |

### Initial administrator bootstrap (CLI only)

Used only by `scripts/bootstrap-admin.ts` via `npm run admin:bootstrap`. Never use through public routes/UI.

| Variable | Scope | Required | Description |
| --- | --- | --- | --- |
| `ADMIN_BOOTSTRAP_EMAIL` | Server/CLI | When bootstrapping | Initial admin email |
| `ADMIN_BOOTSTRAP_PASSWORD` | Server/CLI | When bootstrapping | Strong initial admin password |
| `ADMIN_BOOTSTRAP_FIRST_NAME` | Server/CLI | When bootstrapping | First name |
| `ADMIN_BOOTSTRAP_LAST_NAME` | Server/CLI | When bootstrapping | Last name |
| `ADMIN_BOOTSTRAP_ROLE` | Server/CLI | Optional | `SUPER_ADMIN` or `ADMIN` |

> Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Database credentials and other secrets must remain server-side.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks (`tsc --noEmit`) |
| `npm test` | Run the test suite once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:validate` | Validate the Prisma schema |
| `npm run prisma:migrate` | Create/apply a development migration (`prisma migrate dev`) |
| `npm run prisma:migrate:deploy` | Apply committed migrations |
| `npm run prisma:status` | Show migration status |
| `npm run db:seed` | Seed supported currencies (repeatable) |
| `npm run db:check` | Execute database connectivity/check SQL script |
| `npm run admin:bootstrap` | Bootstrap an initial admin user via CLI |
| `npm run phase004-runtime-validate` | Run Phase 004 runtime validation script (project-specific) |

## Project structure

```text
veltrix-bank/
├── prisma/                  # Prisma schema, migrations, seed data
├── public/                  # Static assets
├── scripts/                 # Utility, validation, bootstrap, and acceptance scripts
├── src/
│   ├── app/                 # Next.js App Router (public/customer/admin routes, API)
│   ├── components/          # Reusable UI, layout, auth, and dashboard components
│   ├── config/              # Application/navigation/currency configuration
│   ├── lib/                 # Auth, env, Prisma, money, dashboard, and utility modules
│   ├── server/              # Server-side actions/services
│   ├── types/               # Shared TypeScript types
│   └── validation/          # Zod schemas and validation helpers
├── tests/                   # Automated tests (Vitest / Testing Library)
├── .env.example             # Environment variable template
├── AGENTS.md                # Repository development rules and phase discipline
├── DATABASE.md              # Database architecture and implementation notes
├── prisma7.config.ts        # Prisma 7 configuration
└── README.md
```

> Note: Generated artifacts (e.g. Prisma client output, build output, local env files) may be gitignored and are not all listed above.

## Database

- **Engine:** MySQL 8.x (local WAMP in current development setup), accessed through Prisma 7 with the MariaDB adapter
- **Migrations:** managed with Prisma Migrate in `prisma/migrations`
- **Supported currencies:** GBP, USD, AUD (seeded via `npm run db:seed`)
- **Design principles (project-level):** data integrity, server-enforced operations, append-only/auditable records where applicable, and separation of concerns for future financial features

See [DATABASE.md](DATABASE.md) for schema details, constraints, relationships, and operational notes.

## Security and simulation notes

- **Simulation disclaimer:** no real money movement and no real banking/payment network connectivity.
- **Secrets management:** never commit `.env`; do not expose database credentials, SMTP secrets, or privileged values in client-side code.
- **Authentication & authorization:** sensitive auth flows, session handling, and ownership/role checks are enforced server-side.
- **Financial integrity (for future/related features):** project rules require backend-only financial calculations, atomic and auditable operations, duplicate-processing protection, and double-entry accounting for money-related operations.
- **Current dashboard scope:** customer dashboard/account/transaction views are read-only and intended to display actual owned records without enabling financial mutations.

## Quality checks

Run these locally to validate the application state:

```bash
npm run lint
npm run typecheck
npm run prisma:validate
npm test
npm run build
```

Additional project-specific validation scripts are available in `package.json` and `scripts/` (for example, runtime/acceptance helpers used during phased development).

## Troubleshooting

- **Database connection/check fails**
  - Confirm MySQL/MariaDB is running and accessible at the host/port in `DATABASE_URL`
  - Verify credentials and database names (`veltrix_bank`, `veltrix_shadow` or your configured equivalents)
  - Ensure the shadow database exists and Prisma has required permissions for migrations
- **Prisma client errors after schema changes**
  - Run `npm run prisma:generate` (and apply migrations if needed)
- **Migrations fail**
  - Confirm `SHADOW_DATABASE_URL` is set correctly and points to a separate database
  - Review `npm run prisma:status` and migration files in `prisma/migrations`
- **Auth emails not received**
  - Check SMTP variables in `.env`; if SMTP is incomplete, the app must not claim delivery
  - Review server logs in development for safe delivery/status information
- **Port already in use**
  - Stop other processes using port `3000` or run Next.js on a different port

## Known limitations and roadmap

- **Simulated scope:** no real financial processing or external banking/payment integrations
- **Read-only customer finance views (current phase):** no deposits, withdrawals, transfers, currency conversion, payments, funding, or transaction/ledger mutation features implemented
- **Phased delivery:** some areas/routes may remain placeholders or limited until later approved phases
- **Project-specific scripts:** acceptance/runtime scripts in `scripts/` are development aids and may assume local tooling/data/setup

Future phases should preserve existing architecture and data integrity, and must remain strictly simulated.

## Development guidelines

- Follow the repository rules in [AGENTS.md](AGENTS.md) (phase discipline, preservation of working functionality, schema/architecture constraints, security and auditability requirements)
- Prefer targeted changes over rewrites; reuse existing components, patterns, and conventions
- Do not introduce mock data where real database-backed behavior is required
- Validate changes with relevant linting, type checks, tests, Prisma validation, and builds before claiming completion

## Additional documentation

- [DATABASE.md](DATABASE.md) — database architecture, schema, migrations, and implementation notes
- [AGENTS.md](AGENTS.md) — project-wide development rules and phase boundaries
- [`.env.example`](.env.example) — environment variable template and setup hints

---

*Veltrix Bank is a demonstration project. All banking functionality is simulated.*