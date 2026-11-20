<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# VELTRIX BANK — GLOBAL DEVELOPMENT RULES

You are working on an existing multi-phase banking application.

Follow these instructions throughout development:

1. Never rebuild the entire application when implementing a new phase.
2. Never delete or overwrite existing working functionality without approval.
3. Preserve the existing database schema and application architecture.
4. Reuse existing components, functions and design systems.
5. Do not create duplicate database tables or duplicate features.
6. Maintain consistent branding and navigation.
7. Do not use mock frontend data where real database functionality is required.
8. Clearly distinguish demonstration data from actual system records.
9. Never expose database secrets or privileged credentials in frontend code.
10. All financial calculations and transactions must be processed securely on the backend.
11. All money-related operations must follow double-entry accounting principles.
12. All financial transactions must be atomic, auditable and protected against duplicate processing.
13. All user roles must have properly enforced permissions.
14. Test every new feature before declaring it complete.
15. Do not claim a feature is working unless it has actually been implemented and tested.
16. Do not proceed to the next development phase until the current phase has passed its acceptance criteria.

At the end of every phase, provide:
- Features implemented.
- Files created or modified.
- Database changes.
- Security measures implemented.
- Tests performed and their results.
- Outstanding issues.
- Any instructions needed before the next phase.

All money, accounts, transfers, cards, loans and payments in Veltrix Bank must remain simulated demonstration functionality.

## Phase 001 scope boundary

Phase 001 establishes structure only. Do not implement customer authentication,
transactions, deposits, withdrawals, or admin functionality until a later phase.
