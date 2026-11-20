import "dotenv/config";

import { randomBytes, randomInt } from "node:crypto";

import { hash } from "@node-rs/argon2";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client";
import { parseServerEnv } from "../src/lib/env.schema";

const MARKERS = [
  { key: "A", email: "veltrix-phase005-a@example.invalid", firstName: "Phase005", lastName: "CustomerA", country: "GB", currency: "GBP" as const, accountType: "CURRENT" as const, accountName: "Phase005 Test Current Account" },
  { key: "B", email: "veltrix-phase005-b@example.invalid", firstName: "Phase005", lastName: "CustomerB", country: "US", currency: "USD" as const, accountType: "SAVINGS" as const, accountName: "Phase005 Test Savings Account" },
];

const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: 2 as const };

function strongPassword(): string {
  // 20+ chars, satisfies typical strong-password policy (upper/lower/digit/symbol)
  return `A!9${randomBytes(12).toString("base64url")}zQ7#`;
}

async function generateAccountNumber(prisma: PrismaClient): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    let candidate = String(randomInt(1, 10));
    for (let i = 1; i < 12; i++) candidate += String(randomInt(0, 10));
    const existing = await prisma.bankAccount.findUnique({ where: { accountNumber: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }
  throw new Error("Unable to generate unique account number");
}

async function main() {
  const mode = process.argv[2] || "status";
  const env = parseServerEnv(process.env);
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(env.DATABASE_URL) });

  try {
    if (mode === "status") {
      const users = await prisma.user.findMany({
        where: { email: { in: MARKERS.map((m) => m.email) } },
        select: {
          id: true, email: true, firstName: true, lastName: true, role: true, accountStatus: true, emailVerified: true,
          accounts: { select: { id: true, accountNumber: true, accountType: true, currencyCode: true, status: true, availableBalance: true, ledgerBalance: true } },
          sessions: { select: { id: true, expiresAt: true, revokedAt: true, createdAt: true } },
        },
        orderBy: { email: "asc" },
      });
      console.log(JSON.stringify({ mode, found: users.length, users: users.map(u => ({
        ...u,
        accounts: u.accounts.map(a => ({ ...a, availableBalance: String(a.availableBalance), ledgerBalance: String(a.ledgerBalance) })),
      })) }, null, 2));
      return;
    }

    if (mode === "setup") {
      const existing = await prisma.user.findMany({ where: { email: { in: MARKERS.map((m) => m.email) } }, select: { id: true, email: true } });
      if (existing.length > 0) {
        console.log(JSON.stringify({ mode, ok: false, reason: "marker_users_already_exist", existing }, null, 2));
        process.exitCode = 2;
        return;
      }

      const now = new Date();
      const created: Array<Record<string, unknown>> = [];

      for (const m of MARKERS) {
        const password = strongPassword();
        const passwordHash = await hash(password, ARGON2_OPTS);
        const accountNumber = await generateAccountNumber(prisma);

        const user = await prisma.user.create({
          data: {
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            phoneNumber: null,
            country: m.country,
            residentialAddress: "Phase 005 acceptance test address",
            passwordHash,
            role: "CUSTOMER",
            emailVerified: true,
            emailVerifiedAt: now,
            termsAcceptedAt: now,
            accountStatus: "ACTIVE",
            kycStatus: "NOT_STARTED",
            accounts: {
              create: {
                accountNumber,
                accountName: m.accountName,
                accountType: m.accountType,
                currencyCode: m.currency,
                availableBalance: 0,
                ledgerBalance: 0,
                status: "ACTIVE",
              },
            },
          },
          select: {
            id: true, email: true, firstName: true, lastName: true,
            accounts: { select: { id: true, accountNumber: true, accountType: true, currencyCode: true, availableBalance: true, ledgerBalance: true, status: true } },
          },
        });

        created.push({
          key: m.key,
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          password,
          account: user.accounts[0] ? {
            id: user.accounts[0].id,
            accountNumber: user.accounts[0].accountNumber,
            accountType: user.accounts[0].accountType,
            currencyCode: user.accounts[0].currencyCode,
            status: user.accounts[0].status,
            availableBalance: String(user.accounts[0].availableBalance),
            ledgerBalance: String(user.accounts[0].ledgerBalance),
          } : null,
        });
      }

      console.log(JSON.stringify({ mode, ok: true, created }, null, 2));
      return;
    }

    if (mode === "cleanup") {
      const users = await prisma.user.findMany({
        where: { email: { in: MARKERS.map((m) => m.email) } },
        select: { id: true, email: true, accounts: { select: { id: true, accountNumber: true } } },
      });
      if (users.length === 0) {
        console.log(JSON.stringify({ mode, ok: true, deleted: false, reason: "no_marker_users_found" }, null, 2));
        return;
      }

      const userIds = users.map((u) => u.id);
      const accountIds = users.flatMap((u) => u.accounts.map((a) => a.id));

      // Safety: refuse cleanup if any financial records exist for these accounts.
      const [txCount, ledgerCount] = await Promise.all([
        accountIds.length ? prisma.transaction.count({ where: { OR: [{ sourceAccountId: { in: accountIds } }, { destinationAccountId: { in: accountIds } }] } }) : Promise.resolve(0),
        accountIds.length ? prisma.ledgerEntry.count({ where: { accountId: { in: accountIds } } }) : Promise.resolve(0),
      ]);
      if (txCount > 0 || ledgerCount > 0) {
        console.log(JSON.stringify({ mode, ok: false, reason: "financial_records_exist_for_test_accounts", txCount, ledgerCount, userIds, accountIds }, null, 2));
        process.exitCode = 3;
        return;
      }

      const sessions = await prisma.session.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
      const evTokens = await prisma.emailVerificationToken.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
      const prTokens = await prisma.passwordResetToken.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
      const sessionIds = sessions.map((s) => s.id);
      const tokenIds = [...evTokens.map((t) => t.id), ...prTokens.map((t) => t.id)];
      const entityIds = [...userIds, ...accountIds, ...sessionIds, ...tokenIds];

      const result = await prisma.$transaction(async (tx) => {
        const deleted: Record<string, number | string> = {};
        // Audit logs are append-only in this schema/environment; do not attempt deletion.
        // They remain as historical records but marker users/accounts/sessions/tokens are removed.
        deleted.auditLogs = "retained_append_only";
        deleted.notifications = (await tx.notification.deleteMany({ where: { userId: { in: userIds } } })).count;
        deleted.sessions = (await tx.session.deleteMany({ where: { userId: { in: userIds } } })).count;
        deleted.emailVerificationTokens = (await tx.emailVerificationToken.deleteMany({ where: { userId: { in: userIds } } })).count;
        deleted.passwordResetTokens = (await tx.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } })).count;
        deleted.kycDocuments = (await tx.kycDocument.deleteMany({ where: { userId: { in: userIds } } })).count;
        deleted.supportTickets = (await tx.supportTicket.deleteMany({ where: { userId: { in: userIds } } })).count;
        deleted.bankAccounts = (await tx.bankAccount.deleteMany({ where: { userId: { in: userIds } } })).count;
        deleted.users = (await tx.user.deleteMany({ where: { id: { in: userIds } } })).count;
        return deleted;
      });

      console.log(JSON.stringify({ mode, ok: true, targetUsers: users.map(u => ({ id: u.id, email: u.email })), result }, null, 2));
      return;
    }

    if (mode === "expire-session") {
      // Usage: expire-session <userEmail|A|B>  -> sets latest active session expiresAt to past (test-only)
      const who = process.argv[3];
      const marker = MARKERS.find(m => m.key === who || m.email === who);
      if (!marker) throw new Error("Provide A, B, or marker email");
      const user = await prisma.user.findUnique({ where: { email: marker.email }, select: { id: true } });
      if (!user) throw new Error("Marker user not found");
      const session = await prisma.session.findFirst({ where: { userId: user.id, revokedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, expiresAt: true } });
      if (!session) { console.log(JSON.stringify({ mode, ok: false, reason: "no_active_session" }, null, 2)); process.exitCode = 4; return; }
      const past = new Date(Date.now() - 60_000);
      await prisma.session.update({ where: { id: session.id }, data: { expiresAt: past } });
      console.log(JSON.stringify({ mode, ok: true, sessionId: session.id, previousExpiresAt: session.expiresAt, newExpiresAt: past }, null, 2));
      return;
    }

    if (mode === "revoke-session") {
      const who = process.argv[3];
      const marker = MARKERS.find(m => m.key === who || m.email === who);
      if (!marker) throw new Error("Provide A, B, or marker email");
      const user = await prisma.user.findUnique({ where: { email: marker.email }, select: { id: true } });
      if (!user) throw new Error("Marker user not found");
      const session = await prisma.session.findFirst({ where: { userId: user.id, revokedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true } });
      if (!session) { console.log(JSON.stringify({ mode, ok: false, reason: "no_active_session" }, null, 2)); process.exitCode = 4; return; }
      const now = new Date();
      await prisma.session.update({ where: { id: session.id }, data: { revokedAt: now } });
      console.log(JSON.stringify({ mode, ok: true, sessionId: session.id, revokedAt: now }, null, 2));
      return;
    }

    throw new Error(`Unknown mode: ${mode}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
