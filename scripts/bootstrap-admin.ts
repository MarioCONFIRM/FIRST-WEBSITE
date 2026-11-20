import "dotenv/config";

import { hash } from "@node-rs/argon2";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../src/generated/prisma/client";
import { parseServerEnv } from "../src/lib/env.schema";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function main(): Promise<void> {
  const env = parseServerEnv(process.env);

  const emailRaw = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "";
  const firstName = (process.env.ADMIN_BOOTSTRAP_FIRST_NAME || "System").trim();
  const lastName = (process.env.ADMIN_BOOTSTRAP_LAST_NAME || "Administrator").trim();
  const role = (process.env.ADMIN_BOOTSTRAP_ROLE || "SUPER_ADMIN").trim().toUpperCase();

  if (!emailRaw || !password) {
    throw new Error(
      "ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD are required. Set them temporarily in your environment/.env, run the bootstrap command, then remove or rotate them.",
    );
  }
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    throw new Error("ADMIN_BOOTSTRAP_ROLE must be ADMIN or SUPER_ADMIN.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD must be at least 12 characters.");
  }

  const email = normalizeEmail(emailRaw);
  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(env.DATABASE_URL) });

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (existing) {
      throw new Error(
        `A user with this email already exists (role: ${existing.role}). Bootstrap aborted to avoid unintended privilege changes.`,
      );
    }

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      algorithm: 2, // Argon2id
    });

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        country: "GB",
        role: role as "ADMIN" | "SUPER_ADMIN",
        emailVerified: true,
        emailVerifiedAt: new Date(),
        accountStatus: "ACTIVE",
        kycStatus: "NOT_STARTED",
      },
      select: { id: true, email: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "admin.bootstrap.created",
        entityType: "User",
        entityId: user.id,
        newValues: { email: user.email, role: user.role },
      },
    });

    console.log("Initial administrator created successfully.");
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log("Remove ADMIN_BOOTSTRAP_* values from your environment after use.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Admin bootstrap failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
