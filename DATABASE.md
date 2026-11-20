# VELTRIX BANK — DATABASE ARCHITECTURE (PHASE 002)

> **Simulation only.** All money, accounts, transfers, cards, loans and payments
> are simulated demonstration functionality. No real banking network is used.

Phase 002 adds the database architecture only. It does **not** add customer
authentication, account-number generation, transaction execution, deposits,
withdrawals, transfers, dashboards or administration.

## 1. Technology decision

The written Phase 002 specification calls for PostgreSQL. Immediately before
this phase, the project was deliberately connected to the local WAMP MySQL
8.4.7 instance at the user's request. To avoid overwriting that working Phase
001 setup, the user chose **Keep WAMP MySQL and adapt Phase 002**.

The same 10 models, relationships, indexes, uniqueness rules, money types and
integrity principles were implemented on MySQL:

| Written requirement | MySQL implementation |
| --- | --- |
| PostgreSQL UUID | `CHAR(36)` with Prisma `@default(uuid())` |
| NUMERIC/DECIMAL money | `DECIMAL(19,4)` for money, `DECIMAL(20,10)` for rates |
| PostgreSQL ENUM | MySQL `ENUM` |
| PostgreSQL connection | `mysql://` connection string and `@prisma/adapter-mariadb` |
| Email unique index | `VARCHAR(191)` (utf8mb4 key-length limit) |

All domain tables explicitly use **InnoDB**. This is essential: WAMP's global
default was MyISAM, which silently discards foreign keys. An earlier migration
attempt produced indexes but no real foreign-key constraints; the migration was
regenerated with explicit `ENGINE=InnoDB` and re-verified.

## 2. Architecture overview

```text
Next.js server modules
        │
        ▼
src/lib/prisma.ts ── PrismaClient + PrismaMariaDb adapter
        │
        ▼
.env DATABASE_URL ── mysql://veltrix_app:...@127.0.0.1:3306/veltrix_bank
        │
        ▼
MySQL 8.4.7 (WAMP) ── veltrix_bank (application) + veltrix_shadow (migrations)
```

- Prisma schema: `prisma/schema.prisma`
- Prisma 7 config: `prisma7.config.ts`
- Generated client: `src/generated/prisma/` (gitignored)
- Migration history: `prisma/migrations/`
- Seed: `prisma/seed.ts`
- Database connection helper: `src/lib/prisma.ts` (`server-only`)
- Environment validation: `src/lib/env.schema.ts` and `src/lib/env.ts`

`DATABASE_URL` and `SHADOW_DATABASE_URL` are read only from the environment.
No credentials are hard-coded in source, schema, seed or docs.

## 3. Local MySQL setup

WAMP MySQL details:

| Setting | Value |
| --- | --- |
| Engine | MySQL 8.4.7 |
| Host/port | `127.0.0.1:3306` |
| Application database | `veltrix_bank` |
| Shadow database | `veltrix_shadow` |
| Application user | `veltrix_app` |
| Unused services | WAMP MariaDB on 3307, Apache |

The `veltrix_app` user has scoped rights on `veltrix_bank` plus `TRIGGER` and
`EXECUTE`. It intentionally does **not** have global `CREATE DATABASE` rights.
Prisma Migrate uses the pre-created `veltrix_shadow` database instead.

One-time administrative setup (run as a MySQL administrator, replace the
password placeholder with a generated 256-bit value):

```sql
CREATE DATABASE IF NOT EXISTS veltrix_bank
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS veltrix_shadow
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'veltrix_app'@'localhost'
  IDENTIFIED BY '<generated-password>';
CREATE USER IF NOT EXISTS 'veltrix_app'@'127.0.0.1'
  IDENTIFIED BY '<generated-password>';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES,
      CREATE TEMPORARY TABLES, LOCK TABLES, TRIGGER, EXECUTE
  ON veltrix_bank.* TO 'veltrix_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX, REFERENCES,
      CREATE TEMPORARY TABLES, LOCK TABLES, TRIGGER, EXECUTE
  ON veltrix_bank.* TO 'veltrix_app'@'127.0.0.1';

GRANT ALL PRIVILEGES ON veltrix_shadow.* TO 'veltrix_app'@'localhost';
GRANT ALL PRIVILEGES ON veltrix_shadow.* TO 'veltrix_app'@'127.0.0.1';

FLUSH PRIVILEGES;
```

### Environment variables

Copy `.env.example` to `.env` and edit it locally. `.env` is gitignored.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Server / Prisma CLI | Application database connection |
| `SHADOW_DATABASE_URL` | Prisma CLI only | Separate database used by Migrate diffing |
| `NODE_ENV` | Server | `development`, `test` or `production` |
| `LOG_LEVEL` | Server | Logging verbosity |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical application URL |
| `NEXT_PUBLIC_APP_NAME` | Public | Display name |

Example format:

```dotenv
DATABASE_URL="mysql://veltrix_app:change-me@127.0.0.1:3306/veltrix_bank"
SHADOW_DATABASE_URL="mysql://veltrix_app:change-me@127.0.0.1:3306/veltrix_shadow"
```

Only `NEXT_PUBLIC_*` variables are exposed to the browser. Database secrets are
validated in server-only code and must never be placed in frontend files.

## 4. Models

| Model | Table | Purpose / key fields |
| --- | --- | --- |
| `User` | `users` | Customer/admin identity. Unique `email`, unique optional `phoneNumber`, `passwordHash` only, `role`, `kycStatus`, `accountStatus`, timestamps. |
| `Currency` | `currencies` | ISO 4217 reference data. Unique `code`, `name`, `symbol`, `isActive`, `decimalPlaces`, timestamps. No rates stored here. |
| `BankAccount` | `bank_accounts` | Customer account. `userId`, unique `accountNumber`, `accountName`, `accountType`, `currencyCode`, `availableBalance`, `ledgerBalance`, `status`, timestamps. |
| `Transaction` | `transactions` | Financial event record. Unique `reference`, `transactionType`, `status`, `description`, `amount`, `currencyCode`, optional source/destination accounts, `initiatedByUserId`, timestamps. No execution logic in this phase. |
| `LedgerEntry` | `ledger_entries` | Double-entry posting. `transactionId`, `accountId`, `entryType`, `amount`, `currencyCode`, `description`, `createdAt`. Immutable after posting. |
| `ExchangeRate` | `exchange_rates` | Historical conversion rate. `baseCurrencyCode`, `quoteCurrencyCode`, `exchangeRate`, `effectiveAt`, `updatedAt`. Append-only. |
| `Notification` | `notifications` | `userId`, `title`, `message`, `notificationType`, `isRead`, `createdAt`. |
| `KycDocument` | `kyc_documents` | `userId`, `documentType`, `documentReference`, `documentStatus`, `submittedAt`, optional `reviewedAt` and `reviewedBy`. Stores references only, never document binaries. |
| `AuditLog` | `audit_logs` | `actorUserId`, `action`, `entityType`, `entityId`, optional JSON `previousValues`/`newValues`, `ipAddress`, `userAgent`, `createdAt`. Append-only. |
| `SupportTicket` | `support_tickets` | `userId`, `subject`, `message`, `status`, `priority`, timestamps. |

Enums: `Role`, `KycStatus`, `AccountStatus`, `AccountType`, `TransactionType`,
`TransactionStatus`, `EntryType`, `NotificationType`, `KycDocumentType`,
`KycDocumentStatus`, `SupportTicketStatus`, `SupportTicketPriority`.

## 5. Relationships

All foreign keys use `ON DELETE RESTRICT`, so deleting a customer or reference
row cannot destroy financial history.

- One `User` has many `BankAccount` rows.
- One `User` has many `Notification` rows.
- One `User` submits many `KycDocument` rows and may review many others.
- One `User` creates many `SupportTicket` rows.
- One `User` initiates many `Transaction` rows.
- One `User` may be the actor in many `AuditLog` rows.
- One `BankAccount` has many `LedgerEntry` rows and may appear as source or
  destination in many transactions.
- One `Transaction` has many `LedgerEntry` rows.
- One `Currency` is used by accounts, transactions, ledger entries and both
  sides of exchange rates.
- Exchange-rate currency relations use `ON UPDATE RESTRICT` because currency
  codes must remain stable while historical rates reference them.

16 foreign-key constraints were verified in the live database.

## 6. Indexes and constraints

### Unique constraints

- `users.email`
- `users.phoneNumber` (multiple `NULL`s are allowed)
- `currencies.code`
- `bank_accounts.accountNumber`
- `transactions.reference`
- `exchange_rates(baseCurrencyCode, quoteCurrencyCode, effectiveAt)`

### Indexed columns

`users.role`, `users.accountStatus`, `users.kycStatus`,
`bank_accounts.userId`, `bank_accounts.currencyCode`,
`bank_accounts.status`, `transactions.status`, `transactions.createdAt`,
`transactions.sourceAccountId`, `transactions.destinationAccountId`,
`transactions.currencyCode`, `transactions.initiatedByUserId`,
`ledger_entries.accountId`, `ledger_entries.transactionId`,
`ledger_entries.currencyCode`, `exchange_rates(base, quote, effectiveAt)`,
`exchange_rates.quoteCurrencyCode`, `notifications.userId`,
`notifications(userId, isRead)`, `kyc_documents.userId`,
`kyc_documents.documentStatus`, `kyc_documents.reviewedBy`,
`audit_logs.createdAt`, `audit_logs.actorUserId`,
`audit_logs(entityType, entityId)`, `support_tickets.userId`,
`support_tickets.status`.

### Database CHECK constraints

- Account balances cannot be negative.
- Transaction, ledger and exchange-rate amounts/rates must be positive.
- Base and quote currencies must differ.
- Required text fields cannot be blank or whitespace-only.

### Immutability triggers

- `ledger_entries_no_update`, `ledger_entries_no_delete`
- `exchange_rates_no_update`, `exchange_rates_no_delete`
- `audit_logs_no_update`, `audit_logs_no_delete`

Corrections must be made as new reversal/effective-dated rows, never by editing
or deleting posted history.

## 7. Supported currencies

Seeded only from `prisma/seed.ts`:

| Code | Name | Symbol | Decimal places |
| --- | --- | --- | --- |
| `GBP` | British Pound | £ | 2 |
| `USD` | United States Dollar | $ | 2 |
| `AUD` | Australian Dollar | A$ | 2 |

The seed is repeatable and uses `upsert` by currency code. It creates **no**
customers, accounts, transactions, exchange rates or other demonstration
records. Exchange rates are intentionally empty.

## 8. Migration commands

From the project directory:

```bash
npm install
npx prisma validate
npx prisma generate

# Development: create a new migration from schema changes
npx prisma migrate dev --name <descriptive_name>

# Apply committed migrations (CI, staging, production-style)
npx prisma migrate deploy

# Check status / detect drift
npx prisma migrate status
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code

# Run the repeatable currency seed
npm run db:seed
```

Equivalent npm scripts are available: `npm run prisma:validate`,
`npm run prisma:generate`, `npm run prisma:migrate`,
`npm run prisma:migrate:deploy`, `npm run prisma:status`, `npm run db:seed`.

Applied migrations:

1. `20261120141359_init` — all tables, indexes, foreign keys, CHECK constraints
   and ledger immutability triggers.
2. `20261120142100_append_only_guards` — exchange-rate and audit-log append-only
   triggers.

`prisma migrate status` reports **Database schema is up to date!** and the
schema-to-database diff reports **No difference detected** (exit code 0).

## 9. Connecting to the database

MySQL CLI (do not paste the password into shell history):

```powershell
$env:MYSQL_PWD = '<value from .env>'
mysql --protocol=TCP --default-character-set=utf8mb4 -h 127.0.0.1 -P 3306 -u veltrix_app veltrix_bank
```

Application smoke test:

```bash
npm run db:check
```

Browse via Prisma Studio:

```bash
npx prisma studio
```

## 10. Financial integrity rules

1. Money uses `DECIMAL(19,4)`; rates use `DECIMAL(20,10)`. Never use JavaScript
   floating-point arithmetic for money.
2. Use Prisma `Decimal` values or strings at boundaries. Do not parse money with
   `parseFloat`/`Number`.
3. Account balances are snapshots. The ledger is the source of truth.
4. Future transaction services must update ledger entries and balance snapshots
   inside one atomic database transaction.
5. Every posted transaction must have balanced debits and credits in the same
   currency. This service-level rule is not implemented in Phase 002.
6. A client-submitted balance is never authoritative.
7. Negative balances are rejected by the current CHECK constraint.
8. Duplicate account numbers, transaction references and effective-dated rates
   are rejected by unique constraints.
9. Ledger entries, exchange rates and audit logs are append-only at the database
   level. Corrections use reversal or new effective-dated records.
10. All financial records use `RESTRICT` on delete; customer deletion cannot
    destroy history.
11. Role-based permissions for audit logs and admin actions will be enforced in
    the authentication/authorization phase. No application roles exist yet.

## 11. Phase 002 verification snapshot

Verified on 2026-11-20:

- `prisma validate` — passed.
- `prisma generate` — passed.
- `migrate deploy` — 2 migrations applied successfully.
- `migrate status` — up to date.
- `migrate diff --exit-code` — no difference, exit code 0.
- Seed run twice — 3 currencies both times, no duplicates.
- Row counts after seed — 3 currencies, 0 rows in all other domain tables.
- Live structure — 10 domain tables all `InnoDB`, 16 foreign keys, 10 CHECK
  constraints, 6 triggers.
- Constraint tests — duplicate code/account/reference/rate key, negative
  balance, blank required field, non-positive amount/rate, invalid FK, ledger
  update/delete, rate update/delete and audit update/delete all rejected as
  expected.
- Relationship test — user → account → transaction → ledger entry → currency
  rate inserted successfully in a rolled-back transaction.
- `npm run typecheck`, `npm run lint`, `npm test` (13/13), `npm run build`
  (24 routes), `npm run db:check` and `npm audit --audit-level=high` — all
  passed.

## 12. Deferred to later phases

- Authentication and password hashing.
- Automatic account-number generation.
- Transaction execution and double-entry balance posting.
- Deposits, withdrawals, transfers and currency conversion.
- Role enforcement, admin UI and customer dashboards.
- Secure KYC document storage outside the database.
