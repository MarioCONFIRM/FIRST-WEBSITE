# Backend services

Server-side service modules for Veltrix Bank.

- **`auth/`** (actions) and auth libraries under `src/lib/auth` support authentication/session flows.
- **`financial/`** (Phase 006A): financial ledger architecture and transaction foundation (double-entry journals, immutable ledger entries, financial transaction records, financial audit logging, validation/reconciliation, and authorized reversal services). See [`financial/README.md`](financial/README.md).

Phase 006A adds **infrastructure only** (no customer deposits/withdrawals/transfers, currency conversion, payment integrations, or customer financial action UI). All money and operations remain simulated demonstration functionality. Financial calculations and ledger operations must be performed on the backend, never in the browser.