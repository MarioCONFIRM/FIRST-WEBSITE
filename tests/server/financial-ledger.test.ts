// @vitest-environment node
import "dotenv/config";

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { randomBytes } from "node:crypto";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { parseServerEnv } from "../../src/lib/env.schema";
import {
  addCreditEntry,
  addDebitEntry,
  calculatePostedLedgerBalance,
  checkIdempotencyKey,
  checkTransactionReference,
  createDraftJournal,
  postBalancedJournal,
  reconcileFinancialLedger,
  reverseFinancialJournal,
  validateJournalBalance,
  type FinancialActorContext,
} from "../../src/server/services/financial";

const env = parseServerEnv(process.env);
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(env.DATABASE_URL) });

const runId = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const ref = (name: string) => `P006A-${runId}-${name}-${randomBytes(2).toString("hex")}`;

let adminUserId: string;
let adminActor: FinancialActorContext;
let customerAActor: FinancialActorContext;
let gbpAccountA1: string;
let gbpAccountA2: string;
let usdAccountA1: string;
let usdAccountA2: string;
let audAccountA1: string;
let audAccountA2: string;
let gbpAccountB: string;

const existingAccountNumber = "273201631000"; // must remain untouched

async function getPreState() {
  return prisma.bankAccount.findUnique({
    where: { accountNumber: existingAccountNumber },
    select: {
      accountNumber: true,
      availableBalance: true,
      ledgerBalance: true,
      status: true,
      currencyCode: true,
      userId: true,
    },
  });
}

async function createTestUser(tag: string, role: "CUSTOMER" | "ADMIN") {
  return prisma.user.create({
    data: {
      firstName: "Phase006A",
      lastName: tag,
      email: `phase006a-${runId}-${tag}@example.invalid`,
      passwordHash: "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHQ$invalidhashbutnotused",
      country: "GB",
      role,
      accountStatus: "ACTIVE",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      kycStatus: "NOT_STARTED",
    },
    select: { id: true, role: true },
  });
}

async function createTestAccount(
  userId: string,
  currencyCode: "GBP" | "USD" | "AUD",
  tag: string,
) {
  const accountNumber = `T${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`.slice(0, 12);
  return prisma.bankAccount.create({
    data: {
      userId,
      accountNumber,
      accountName: `Phase006A ${tag} ${currencyCode}`,
      accountType: "CURRENT",
      currencyCode,
      availableBalance: new Prisma.Decimal(0),
      ledgerBalance: new Prisma.Decimal(0),
      status: "ACTIVE",
    },
    select: { id: true, accountNumber: true, currencyCode: true, userId: true },
  });
}

async function createAndPostBalanced(params: {
  journalRef: string;
  type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "CURRENCY_CONVERSION" | "FEE" | "REVERSAL";
  currency: "GBP" | "USD" | "AUD";
  debitAccountId: string;
  creditAccountId: string;
  amount: string;
  description: string;
}) {
  const journal = await createDraftJournal({
    journalReference: params.journalRef,
    transactionType: params.type,
    description: params.description,
    currencyCode: params.currency,
    createdByUserId: adminUserId,
    actor: adminActor,
  });
  await addDebitEntry({
    journalId: journal.id,
    accountId: params.debitAccountId,
    amount: params.amount,
    currencyCode: params.currency,
    actor: adminActor,
  });
  await addCreditEntry({
    journalId: journal.id,
    accountId: params.creditAccountId,
    amount: params.amount,
    currencyCode: params.currency,
    actor: adminActor,
  });
  return postBalancedJournal({ journalId: journal.id, actor: adminActor });
}

let preState: Awaited<ReturnType<typeof getPreState>>;

beforeAll(async () => {
  preState = await getPreState();
  const admin = await createTestUser("admin", "ADMIN");
  const custA = await createTestUser("cust-a", "CUSTOMER");
  const custB = await createTestUser("cust-b", "CUSTOMER");
  adminUserId = admin.id;
  adminActor = { actorUserId: admin.id, actorRole: "ADMIN" };
  customerAActor = { actorUserId: custA.id, actorRole: "CUSTOMER" };

  const [g1, g2, u1, u2, a1, a2, b1] = await Promise.all([
    createTestAccount(custA.id, "GBP", "A1"),
    createTestAccount(custA.id, "GBP", "A2"),
    createTestAccount(custA.id, "USD", "A1"),
    createTestAccount(custA.id, "USD", "A2"),
    createTestAccount(custA.id, "AUD", "A1"),
    createTestAccount(custA.id, "AUD", "A2"),
    createTestAccount(custB.id, "GBP", "B1"),
  ]);
  gbpAccountA1 = g1.id;
  gbpAccountA2 = g2.id;
  usdAccountA1 = u1.id;
  usdAccountA2 = u2.id;
  audAccountA1 = a1.id;
  audAccountA2 = a2.id;
  gbpAccountB = b1.id;
});

afterAll(async () => {
  try {
    // Verify existing production-like account record preserved (balances/status untouched)
    const post = await getPreState();
    expect(post).toEqual(preState);
  } finally {
    await prisma.$disconnect();
  }
});

describe("Phase 006A financial ledger foundation", () => {
  test("1. Balanced debit and credit journal can be created and posted", async () => {
    const journal = await createDraftJournal({
      journalReference: ref("balanced-j"),
      transactionType: "DEPOSIT",
      description: "Balanced test journal",
      currencyCode: "GBP",
      createdByUserId: adminUserId,
      actor: adminActor,
    });
    await addDebitEntry({
      journalId: journal.id,
      accountId: gbpAccountA1,
      amount: "100.0000",
      currencyCode: "GBP",
      actor: adminActor,
    });
    await addCreditEntry({
      journalId: journal.id,
      accountId: gbpAccountA2,
      amount: "100.0000",
      currencyCode: "GBP",
      actor: adminActor,
    });

    const validation = await validateJournalBalance(journal.id);
    expect(validation.valid).toBe(true);
    expect(validation.totalDebit.toFixed(4)).toBe("100.0000");
    expect(validation.totalCredit.toFixed(4)).toBe("100.0000");

    const posted = await postBalancedJournal({ journalId: journal.id, actor: adminActor });
    expect(posted.status).toBe("POSTED");
    expect(posted.postedAt).toBeTruthy();
    expect(posted.totalDebit.toFixed(4)).toBe("100.0000");
    expect(posted.totalCredit.toFixed(4)).toBe("100.0000");
  });

  test("2. Unbalanced journal posting is rejected", async () => {
    const journal = await createDraftJournal({
      journalReference: ref("unbalanced-j"),
      transactionType: "TRANSFER",
      description: "Unbalanced test journal",
      currencyCode: "GBP",
      createdByUserId: adminUserId,
      actor: adminActor,
    });
    await addDebitEntry({ journalId: journal.id, accountId: gbpAccountA1, amount: "50.0000", currencyCode: "GBP", actor: adminActor });
    await addCreditEntry({ journalId: journal.id, accountId: gbpAccountA2, amount: "40.0000", currencyCode: "GBP", actor: adminActor });

    await expect(postBalancedJournal({ journalId: journal.id, actor: adminActor })).rejects.toMatchObject({
      code: "UNBALANCED_JOURNAL",
    });

    const fresh = await prisma.financialJournal.findUnique({ where: { id: journal.id } });
    expect(fresh?.status).toBe("DRAFT");
  });

  test("3. Zero-value entry is rejected", async () => {
    const journal = await createDraftJournal({
      journalReference: ref("zero-j"),
      transactionType: "FEE",
      description: "Zero entry test",
      currencyCode: "GBP",
      createdByUserId: adminUserId,
      actor: adminActor,
    });
    await expect(
      addDebitEntry({ journalId: journal.id, accountId: gbpAccountA1, amount: "0", currencyCode: "GBP", actor: adminActor }),
    ).rejects.toMatchObject({ code: "INVALID_AMOUNT" });
    await expect(
      addDebitEntry({ journalId: journal.id, accountId: gbpAccountA1, amount: "0.0000", currencyCode: "GBP", actor: adminActor }),
    ).rejects.toMatchObject({ code: "INVALID_AMOUNT" });
  });

  test("4. Negative-value entry is rejected", async () => {
    const journal = await createDraftJournal({
      journalReference: ref("neg-j"),
      transactionType: "FEE",
      description: "Negative entry test",
      currencyCode: "GBP",
      createdByUserId: adminUserId,
      actor: adminActor,
    });
    await expect(
      addCreditEntry({ journalId: journal.id, accountId: gbpAccountA1, amount: "-5.0000", currencyCode: "GBP", actor: adminActor }),
    ).rejects.toMatchObject({ code: "INVALID_AMOUNT" });
  });

  test("5. Cross-currency journal/entry is rejected", async () => {
    const journal = await createDraftJournal({
      journalReference: ref("xcurr-j"),
      transactionType: "TRANSFER",
      description: "Cross currency test",
      currencyCode: "GBP",
      createdByUserId: adminUserId,
      actor: adminActor,
    });
    // USD account cannot be used with GBP entry/journal
    await expect(
      addDebitEntry({ journalId: journal.id, accountId: usdAccountA1, amount: "10.0000", currencyCode: "GBP", actor: adminActor }),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });

    // Entry currency mismatching journal currency rejected
    await expect(
      addDebitEntry({ journalId: journal.id, accountId: gbpAccountA1, amount: "10.0000", currencyCode: "USD", actor: adminActor }),
    ).rejects.toMatchObject({ code: "CROSS_CURRENCY_JOURNAL" });
  });

  test("6. Duplicate journal reference is rejected", async () => {
    const jr = ref("dup-ref-j");
    await createDraftJournal({
      journalReference: jr,
      transactionType: "DEPOSIT",
      description: "First",
      currencyCode: "GBP",
      createdByUserId: adminUserId,
      actor: adminActor,
    });
    await expect(
      createDraftJournal({
        journalReference: jr,
        transactionType: "DEPOSIT",
        description: "Duplicate",
        currencyCode: "GBP",
        createdByUserId: adminUserId,
        actor: adminActor,
      }),
    ).rejects.toMatchObject({ code: "DUPLICATE_REFERENCE" });
  });

  test("7. Duplicate idempotency key is rejected (DB unique constraint)", async () => {
    const key = ref("idem-key");
    const txRef1 = ref("idem-tx-1");
    const txRef2 = ref("idem-tx-2");

    await prisma.financialTransaction.create({
      data: {
        transactionReference: txRef1,
        transactionType: "DEPOSIT",
        transactionStatus: "PENDING",
        currencyCode: "GBP",
        amount: new Prisma.Decimal("10.0000"),
        idempotencyKey: key,
      },
    });

    const check = await checkIdempotencyKey(key);
    expect(check.exists).toBe(true);

    await expect(
      prisma.financialTransaction.create({
        data: {
          transactionReference: txRef2,
          transactionType: "DEPOSIT",
          transactionStatus: "PENDING",
          currencyCode: "GBP",
          amount: new Prisma.Decimal("10.0000"),
          idempotencyKey: key,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    // Check helper for transaction references
    const refCheck = await checkTransactionReference(txRef1);
    expect(refCheck.exists).toBe(true);
  });

  test("8. Posted journal and its ledger entries are immutable", async () => {
    const journal = await createDraftJournal({
      journalReference: ref("immut-j"),
      transactionType: "DEPOSIT",
      description: "Immutability test",
      currencyCode: "GBP",
      createdByUserId: adminUserId,
      actor: adminActor,
    });
    const d = await addDebitEntry({ journalId: journal.id, accountId: gbpAccountA1, amount: "25.0000", currencyCode: "GBP", actor: adminActor });
    await addCreditEntry({ journalId: journal.id, accountId: gbpAccountA2, amount: "25.0000", currencyCode: "GBP", actor: adminActor });
    await postBalancedJournal({ journalId: journal.id, actor: adminActor });

    // Ledger entries immutable (DB triggers)
    await expect(
      prisma.financialLedgerEntry.update({ where: { id: d.entry.id }, data: { amount: new Prisma.Decimal("30.0000") } }),
    ).rejects.toBeTruthy();
    await expect(prisma.financialLedgerEntry.delete({ where: { id: d.entry.id } })).rejects.toBeTruthy();

    // Posted journal immutable (no arbitrary edits/deletes)
    await expect(
      prisma.financialJournal.update({ where: { id: journal.id }, data: { description: "tampered" } }),
    ).rejects.toBeTruthy();
    await expect(prisma.financialJournal.delete({ where: { id: journal.id } })).rejects.toBeTruthy();
  });

  test("9. Unauthorized journal posting/creation is rejected for customer actor", async () => {
    // Customer cannot create draft journals (privileged operation)
    await expect(
      createDraftJournal({
        journalReference: ref("cust-create-j"),
        transactionType: "DEPOSIT",
        description: "Customer forbidden",
        currencyCode: "GBP",
        createdByUserId: adminUserId, // also mismatched, but role check comes first
        actor: customerAActor,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    // Customer cannot post a prepared draft journal
    const journal = await createDraftJournal({
      journalReference: ref("unauth-post-j"),
      transactionType: "DEPOSIT",
      description: "Customer posting forbidden",
      currencyCode: "GBP",
      createdByUserId: adminUserId,
      actor: adminActor,
    });
    await addDebitEntry({ journalId: journal.id, accountId: gbpAccountA1, amount: "10.0000", currencyCode: "GBP", actor: adminActor });
    await addCreditEntry({ journalId: journal.id, accountId: gbpAccountA2, amount: "10.0000", currencyCode: "GBP", actor: adminActor });

    await expect(
      postBalancedJournal({ journalId: journal.id, actor: customerAActor }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const fresh = await prisma.financialJournal.findUnique({ where: { id: journal.id } });
    expect(fresh?.status).toBe("DRAFT");
  });

  test("10. Customer account ownership is enforced for ledger access", async () => {
    await expect(
      calculatePostedLedgerBalance({ accountId: gbpAccountB, currencyCode: "GBP", actor: customerAActor }),
    ).rejects.toMatchObject({ code: "ACCOUNT_OWNERSHIP" });
  });

  test("11. Correct posted balance calculation follows accounting convention", async () => {
    // Use dedicated accounts to avoid interference: create fresh ones for this test
    const x1 = await createTestAccount(customerAActor.actorUserId, "GBP", "BAL-X1");
    const x2 = await createTestAccount(customerAActor.actorUserId, "GBP", "BAL-X2");

    await createAndPostBalanced({
      journalRef: ref("bal-j1"),
      type: "DEPOSIT",
      currency: "GBP",
      debitAccountId: x2.id,
      creditAccountId: x1.id,
      amount: "100.0000",
      description: "Balance calc 1 (credit x1)",
    });
    await createAndPostBalanced({
      journalRef: ref("bal-j2"),
      type: "WITHDRAWAL",
      currency: "GBP",
      debitAccountId: x1.id,
      creditAccountId: x2.id,
      amount: "30.0000",
      description: "Balance calc 2 (debit x1)",
    });

    const balX1 = await calculatePostedLedgerBalance({ accountId: x1.id, currencyCode: "GBP", actor: adminActor });
    const balX2 = await calculatePostedLedgerBalance({ accountId: x2.id, currencyCode: "GBP", actor: adminActor });

    // Convention: postedBalance = sum(CREDIT) - sum(DEBIT)
    expect(balX1.creditTotal.toFixed(4)).toBe("100.0000");
    expect(balX1.debitTotal.toFixed(4)).toBe("30.0000");
    expect(balX1.postedBalance.toFixed(4)).toBe("70.0000");
    expect(balX2.postedBalance.toFixed(4)).toBe("-70.0000");
  });

  test("12. GBP, USD and AUD posted balance calculations are independent", async () => {
    // Use dedicated accounts for GBP to avoid contamination from earlier tests in this suite.
    const gbpIndA = await createTestAccount(customerAActor.actorUserId, "GBP", "IND-A");
    const gbpIndB = await createTestAccount(customerAActor.actorUserId, "GBP", "IND-B");

    await createAndPostBalanced({
      journalRef: ref("ind-gbp"),
      type: "DEPOSIT",
      currency: "GBP",
      debitAccountId: gbpIndB.id,
      creditAccountId: gbpIndA.id,
      amount: "11.1100",
      description: "GBP independent",
    });
    await createAndPostBalanced({
      journalRef: ref("ind-usd"),
      type: "DEPOSIT",
      currency: "USD",
      debitAccountId: usdAccountA2,
      creditAccountId: usdAccountA1,
      amount: "22.2200",
      description: "USD independent",
    });
    await createAndPostBalanced({
      journalRef: ref("ind-aud"),
      type: "DEPOSIT",
      currency: "AUD",
      debitAccountId: audAccountA2,
      creditAccountId: audAccountA1,
      amount: "33.3300",
      description: "AUD independent",
    });

    const gbp = await calculatePostedLedgerBalance({ accountId: gbpIndA.id, currencyCode: "GBP", actor: adminActor });
    const usd = await calculatePostedLedgerBalance({ accountId: usdAccountA1, currencyCode: "USD", actor: adminActor });
    const aud = await calculatePostedLedgerBalance({ accountId: audAccountA1, currencyCode: "AUD", actor: adminActor });

    // Each reflects only its own currency postings; no aggregation across currencies
    expect(gbp.postedBalance.toFixed(4)).toBe("11.1100");
    expect(usd.postedBalance.toFixed(4)).toBe("22.2200");
    expect(aud.postedBalance.toFixed(4)).toBe("33.3300");

    // Currency mismatch on query is rejected (account currency != requested currency)
    await expect(
      calculatePostedLedgerBalance({ accountId: gbpIndA.id, currencyCode: "USD", actor: adminActor }),
    ).rejects.toMatchObject({ code: "CURRENCY_MISMATCH" });
  });

  test("13. Atomic rollback when journal posting fails (no partial posting state)", async () => {
    const journal = await createDraftJournal({
      journalReference: ref("atomic-fail-j"),
      transactionType: "TRANSFER",
      description: "Atomic rollback posting failure",
      currencyCode: "GBP",
      createdByUserId: adminUserId,
      actor: adminActor,
    });
    await addDebitEntry({ journalId: journal.id, accountId: gbpAccountA1, amount: "10.0000", currencyCode: "GBP", actor: adminActor });
    await addCreditEntry({ journalId: journal.id, accountId: gbpAccountA2, amount: "9.0000", currencyCode: "GBP", actor: adminActor });

    const beforePostedAudit = await prisma.financialAuditLog.count({
      where: { affectedEntity: "FinancialJournal", entityReference: journal.id, action: "financial_journal.posted" },
    });

    await expect(postBalancedJournal({ journalId: journal.id, actor: adminActor })).rejects.toMatchObject({
      code: "UNBALANCED_JOURNAL",
    });

    const fresh = await prisma.financialJournal.findUnique({ where: { id: journal.id } });
    expect(fresh?.status).toBe("DRAFT");
    expect(fresh?.postedAt).toBeNull();

    const afterPostedAudit = await prisma.financialAuditLog.count({
      where: { affectedEntity: "FinancialJournal", entityReference: journal.id, action: "financial_journal.posted" },
    });
    expect(afterPostedAudit).toBe(beforePostedAudit);
  });

  test("14. Reversal uses a separate compensating journal and marks original as REVERSED", async () => {
    const src1 = await createTestAccount(customerAActor.actorUserId, "GBP", "REV-S1");
    const src2 = await createTestAccount(customerAActor.actorUserId, "GBP", "REV-S2");

    const originalPosted = await createAndPostBalanced({
      journalRef: ref("orig-rev-j"),
      type: "DEPOSIT",
      currency: "GBP",
      debitAccountId: src2.id,
      creditAccountId: src1.id,
      amount: "44.0000",
      description: "Original to reverse",
    });
    expect(originalPosted.status).toBe("POSTED");

    const before = await calculatePostedLedgerBalance({ accountId: src1.id, currencyCode: "GBP", actor: adminActor });
    expect(before.postedBalance.toFixed(4)).toBe("44.0000");

    const rev = await reverseFinancialJournal({
      journalId: originalPosted.id,
      actor: adminActor,
      reversalJournalReference: ref("comp-rev-j"),
      reversalTransactionReference: ref("comp-rev-tx"),
      reason: "Test reversal",
    });
    expect(rev.originalStatus).toBe("REVERSED");
    expect(rev.reversalJournalId).not.toBe(originalPosted.id);

    const origAfter = await prisma.financialJournal.findUnique({ where: { id: originalPosted.id } });
    const reversalJournal = await prisma.financialJournal.findUnique({
      where: { id: rev.reversalJournalId },
      include: { entries: true },
    });
    expect(origAfter?.status).toBe("REVERSED");
    expect(reversalJournal?.status).toBe("POSTED");
    expect(reversalJournal?.entries.length).toBe(2);
    expect(reversalJournal?.totalDebit.toFixed(4)).toBe("44.0000");
    expect(reversalJournal?.totalCredit.toFixed(4)).toBe("44.0000");

    // Compensating entries swap debit/credit directions relative to original effect
    const entryTypes = reversalJournal!.entries.map((e) => e.entryType).sort();
    expect(entryTypes).toEqual(["CREDIT", "DEBIT"]);

    // Net posted balance effect of original + compensating reversal is zero
    const after = await calculatePostedLedgerBalance({ accountId: src1.id, currencyCode: "GBP", actor: adminActor });
    expect(after.postedBalance.toFixed(4)).toBe("0.0000");

    // Unauthorized reversal rejected (customer cannot reverse posted journals)
    await expect(
      reverseFinancialJournal({
        journalId: reversalJournal!.id,
        actor: customerAActor,
        reversalJournalReference: ref("bad-rev"),
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  test("15. Concurrent posting protection allows only one successful post", async () => {
    const journal = await createDraftJournal({
      journalReference: ref("concurrent-j"),
      transactionType: "TRANSFER",
      description: "Concurrent posting test",
      currencyCode: "GBP",
      createdByUserId: adminUserId,
      actor: adminActor,
    });
    await addDebitEntry({ journalId: journal.id, accountId: gbpAccountA1, amount: "15.0000", currencyCode: "GBP", actor: adminActor });
    await addCreditEntry({ journalId: journal.id, accountId: gbpAccountA2, amount: "15.0000", currencyCode: "GBP", actor: adminActor });

    const [r1, r2] = await Promise.allSettled([
      postBalancedJournal({ journalId: journal.id, actor: adminActor }),
      postBalancedJournal({ journalId: journal.id, actor: adminActor }),
    ]);

    const fulfilled = [r1, r2].filter((r) => r.status === "fulfilled");
    const rejected = [r1, r2].filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    const reason = rejected[0]?.reason as { code?: string } | undefined;
    expect(reason?.code).toBe("INVALID_STATE");

    const fresh = await prisma.financialJournal.findUnique({ where: { id: journal.id } });
    expect(fresh?.status).toBe("POSTED");

    const postedAuditCount = await prisma.financialAuditLog.count({
      where: { affectedEntity: "FinancialJournal", entityReference: journal.id, action: "financial_journal.posted" },
    });
    expect(postedAuditCount).toBe(1);
  });

  test("16. Reconciliation detects accounting inconsistencies without modifying records", async () => {
    // Create an isolated unbalanced POSTED journal by bypassing service posting
    // (controlled test setup using DB primitives inside a transaction that we commit intentionally as isolated test data)
    const unbalancedPostedRef = ref("recon-unbal-posted");
    const j = await prisma.financialJournal.create({
      data: {
        journalReference: unbalancedPostedRef,
        transactionType: "TRANSFER",
        status: "POSTED",
        description: "Isolated reconciliation-detection fixture (intentionally inconsistent)",
        currencyCode: "GBP",
        totalDebit: new Prisma.Decimal("10.0000"),
        totalCredit: new Prisma.Decimal("5.0000"), // intentionally inconsistent with entries/totals
        createdByUserId: adminUserId,
        postedAt: new Date(),
        entries: {
          create: [
            { accountId: gbpAccountA1, entryType: "DEBIT", amount: new Prisma.Decimal("10.0000"), currencyCode: "GBP" },
            { accountId: gbpAccountA2, entryType: "CREDIT", amount: new Prisma.Decimal("5.0000"), currencyCode: "GBP" },
          ],
        },
      },
    });

    const before = await prisma.financialJournal.findUnique({ where: { id: j.id }, include: { entries: true } });
    expect(before?.status).toBe("POSTED");

    const report = await reconcileFinancialLedger({ actor: adminActor, journalId: j.id });
    expect(report.ok).toBe(false);
    expect(report.summary.unbalancedPostedJournals).toBeGreaterThanOrEqual(1);
    expect(report.issues.some((i) => i.code === "UNBALANCED_POSTED_JOURNAL" || i.code === "JOURNAL_TOTAL_MISMATCH")).toBe(true);

    // Validation service must not modify financial records
    const after = await prisma.financialJournal.findUnique({ where: { id: j.id }, include: { entries: true } });
    expect(after?.status).toBe(before?.status);
    expect(after?.totalDebit.toFixed(4)).toBe(before?.totalDebit.toFixed(4));
    expect(after?.totalCredit.toFixed(4)).toBe(before?.totalCredit.toFixed(4));
    expect(after?.entries.length).toBe(before?.entries.length);
  });
});
