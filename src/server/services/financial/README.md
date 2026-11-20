# Phase 006A — Financial Ledger Architecture and Transaction Foundation

> **Scope:** Phase 006A establishes the accounting/ledger foundation only. It does **not** implement customer deposits, withdrawals, transfers, currency conversion, payment gateway integration, real-money transactions, automated financial transaction execution, admin financial approval interfaces, or customer financial action buttons. All functionality remains **simulated/demonstration** infrastructure for future phases.

## Overview

This module provides server-side, database-backed primitives for a double-entry financial ledger on top of the existing Veltrix Bank stack (Next.js App Router, TypeScript, Prisma 7, MySQL/WAMP, existing auth/roles).

**Core entities (additive):**
- `FinancialJournal` (`financial_journals`) — double-entry journal header
- `FinancialLedgerEntry` (`financial_ledger_entries`) — immutable debit/credit postings belonging to a journal
- `FinancialTransaction` (`financial_transactions`) — transaction record with optional account/customer/journal linkage and idempotency key
- `FinancialAuditLog` (`financial_audit_logs`) — append-only audit trail for financial foundation actions

Existing Phase 002/004 tables and records (`transactions`, `ledger_entries`, `audit_logs`, users, accounts, balances, etc.) are preserved and unchanged.

## Accounting convention (documented)

- **Account perspective:** Customer bank accounts (`bank_accounts`) are treated as **liability accounts** from the institution's perspective.
- **Entry effect on posted ledger balance (per account, per currency):**
  - **CREDIT** increases the account's posted ledger balance
  - **DEBIT** decreases the account's posted ledger balance
- **Posted balance formula:**
  - `postedBalance = sum(CREDIT amounts) - sum(DEBIT amounts)`
  - Includes entries whose parent journal has been **posted** (`FinancialJournal.status` is `POSTED` or `REVERSED`); `DRAFT` journals are excluded
  - Calculated **per account and per currency** (no cross-currency aggregation)
- **Journal balancing:** A journal is single-currency. It balances when `totalDebit == totalCredit` for the same currency. Journals must never be evaluated across different currencies.
- **Source of truth:** The ledger (posted journals/entries) is the authoritative accounting record for future simulated financial operations. Snapshot fields on `bank_accounts` (`availableBalance`, `ledgerBalance`) are **not modified** in Phase 006A and must not be treated as client-mutable.

## Decimal precision and scale (documented)

- **Storage/precision:** Monetary amounts use MySQL `DECIMAL(19,4)` for:
  - `financial_journals.totalDebit`, `financial_journals.totalCredit`
  - `financial_ledger_entries.amount`
  - `financial_transactions.amount`
- **Arithmetic:** All calculations use `Prisma.Decimal` (exact decimal arithmetic). **JavaScript floating-point arithmetic is never used for money.**
- **Validation:** Entry/transaction amounts must be finite, **> 0** (no zero or negative values), and representable with scale ≤ 4 decimal places.

## Status lifecycles (documented)

### Financial transaction status (`FinancialTransactionStatus`)
`PENDING` → `PROCESSING` → `COMPLETED` | `FAILED` | `REJECTED` | `CANCELLED`

- Lifecycle is controlled by application services/workflows (foundation records/status support). Terminal/error states are represented explicitly.

### Financial journal status (`FinancialJournalStatus`)
`DRAFT` → `POSTED` → `REVERSED`

- **DRAFT:** entries may be added (insert-only) via services; totals recomputed; not included in posted-ledger balance calculations.
- **POSTED:** balanced, immutable in effect journal; included in posted-ledger balance calculations; cannot be edited/deleted (except controlled reversal transition).
- **REVERSED:** a previously posted journal that has been reversed; immutable and remains included in posted-ledger balance calculations for historical completeness, with its effect offset by a separate compensating `POSTED` reversal journal.

> Posted-ledger balance calculations include journals with status `POSTED` or `REVERSED` (i.e. all journals that have been posted). `DRAFT` journals are excluded.

## Ledger posting workflow

1. **Create draft journal** (privileged): `createDraftJournal(...)`
   - Validates actor authorization, currency, required fields; enforces unique `journalReference` (DB unique constraint)
2. **Add debit/credit entries** (privileged, DRAFT only): `addDebitEntry(...)`, `addCreditEntry(...)`
   - Locks journal row (`FOR UPDATE`) in a DB transaction, validates DRAFT state, amount > 0, currency compatibility (journal/entry/account), account existence/currency, inserts immutable entry, recomputes and persists totals
3. **Validate balance**: `validateJournalBalance(...)` / `calculateJournalTotals(...)`
4. **Post balanced journal** (privileged): `postBalancedJournal(...)`
   - Serializable transaction + `SELECT ... FOR UPDATE` lock on journal to prevent concurrent posting/races
   - Recomputes totals from entries and validates: ≥ 2 entries, all amounts > 0, single currency consistent with journal and accounts, `totalDebit == totalCredit > 0`
   - Sets `status=POSTED`, `postedAt`, persisted totals; records financial audit event
   - **No `bank_accounts` balance fields are modified**
5. **Reversal** (authorized, audited, non-unrestricted): `reverseFinancialJournal(...)`
   - Requires `ADMIN`/`SUPER_ADMIN`, locks original `POSTED` journal, creates and posts a **separate compensating reversal journal** (debits/credits swapped, `transactionType = REVERSAL`), then transitions the original journal `POSTED -> REVERSED` (DB trigger enforces allowed transition only), and records audit events
   - Both the original (`REVERSED`) and compensating (`POSTED`) journals remain in the ledger and are included in posted-ledger balance calculations, so their net financial effect is zero while preserving immutable history
   - Historical posted entries are never edited or deleted

## Security and authorization controls

- **Server-side only:** all services use `server-only` and Prisma/DB access on the server.
- **Actor context required:** privileged operations accept explicit `FinancialActorContext` (`actorUserId`, `actorRole`) derived from trusted server-side session/auth; **trusted actor IDs must never be supplied by unverified client input**.
- **Privileged operations:** journal creation/entry addition/posting/reversal and privileged reconciliation/ledger access require `ADMIN` or `SUPER_ADMIN` (explicitly checked).
- **Ownership enforcement:** customer-scoped ledger/balance access is restricted to accounts owned by the authenticated customer; unauthorized cross-customer access is rejected.
- **No balance mutation:** services do not provide direct customer balance mutation and do not modify `bank_accounts` snapshot balances in this phase.
- **No sensitive exposure:** services return structured data for server use; callers must not expose sensitive financial records through client props, APIs, logs, or RSC payloads.
- **DB-level protections:** foreign keys (`ON DELETE RESTRICT`), unique constraints, CHECK constraints, and triggers enforce integrity/immutability/append-only behavior for new financial tables.

## Idempotency and uniqueness

- **DB-enforced uniqueness:** `financial_journals.journalReference`, `financial_transactions.transactionReference`, and `financial_transactions.idempotencyKey` (nullable unique) are protected by database unique constraints.
- **No lookup assumptions:** services/helpers may check existence (`checkTransactionReference`, `checkIdempotencyKey`) but **must not assume** availability based on prior lookup; create/post flows must handle unique-constraint conflicts (`P2002`) safely.
- **Duplicate prevention:** duplicate journal/transaction references and duplicate idempotency keys are rejected.

## Reconciliation and validation

`reconcileFinancialLedger(...)` (privileged, read-only) reports issues **without modifying records**, including:
- Unbalanced posted journals
- Invalid entry amounts
- Currency mismatches
- Missing account relationships
- Duplicate references
- Invalid transaction-to-journal relationships
- Stored-vs-computed total mismatches

## Key services

- Draft/entries/posting/totals/validation: `createDraftJournal`, `addDebitEntry`, `addCreditEntry`, `validateJournalBalance`, `calculateJournalTotals`, `postBalancedJournal`
- Ownership/currency checks: `validateAccountOwnershipAndCurrencyCompatibility`
- Balance calculation (posted, per account+currency): `calculatePostedLedgerBalance`
- References/idempotency checks: `checkTransactionReference`, `checkIdempotencyKey`
- Financial audit events: `recordFinancialAuditEvent`
- Reversal (authorized/audited): `reverseFinancialJournal`
- Reconciliation (report-only): `reconcileFinancialLedger`

## Notes

- Reversal journals use `transactionType = REVERSAL` and swap entry directions to compensate the original posted journal. The compensating journal is posted (`POSTED`) and the original journal transitions to `REVERSED`; both are included in posted-ledger balance calculations so the reversal has net-zero financial effect while preserving immutable history.
- DB triggers make `financial_ledger_entries` and `financial_audit_logs` immutable/append-only, prevent journal deletion, and restrict updates to posted/reversed journals (allowing only `POSTED -> REVERSED` status transition on the original journal record as used by reversal). Draft journal updates (e.g. recomputed totals) are permitted by services.
- This foundation intentionally avoids any customer-facing financial mutation UI/API and any real-money/payment integration.