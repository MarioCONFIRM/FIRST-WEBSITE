import { describe, expect, it } from "vitest";

import { parsePublicEnv, parseServerEnv } from "@/lib/env.schema";

const validConnectionString =
  "mysql://veltrix_app:example@127.0.0.1:3306/veltrix_bank";
const validShadowConnectionString =
  "mysql://veltrix_app:example@127.0.0.1:3306/veltrix_shadow";

const validServerEnv = {
  DATABASE_URL: validConnectionString,
  SHADOW_DATABASE_URL: validShadowConnectionString,
};

describe("environment validation", () => {
  it("requires a MySQL or MariaDB DATABASE_URL", () => {
    expect(() =>
      parseServerEnv({ SHADOW_DATABASE_URL: validShadowConnectionString }),
    ).toThrow(/DATABASE_URL/);
    expect(() =>
      parseServerEnv({
        DATABASE_URL: "postgresql://localhost/bank",
        SHADOW_DATABASE_URL: validShadowConnectionString,
      }),
    ).toThrow(/MySQL or MariaDB connection string/);
  });

  it("requires a MySQL or MariaDB SHADOW_DATABASE_URL for Prisma Migrate", () => {
    expect(() =>
      parseServerEnv({ DATABASE_URL: validConnectionString }),
    ).toThrow(/SHADOW_DATABASE_URL/);
    expect(() =>
      parseServerEnv({
        DATABASE_URL: validConnectionString,
        SHADOW_DATABASE_URL: "postgresql://localhost/shadow",
      }),
    ).toThrow(/SHADOW_DATABASE_URL/);
  });

  it("accepts both mysql:// and mariadb:// connection strings", () => {
    const env = parseServerEnv({
      DATABASE_URL: validConnectionString,
      SHADOW_DATABASE_URL:
        "mariadb://veltrix_app:example@localhost:3307/veltrix_shadow",
    });

    expect(env.DATABASE_URL).toBe(validConnectionString);
    expect(env.SHADOW_DATABASE_URL).toContain("mariadb://");
  });

  it("applies safe server defaults", () => {
    const env = parseServerEnv(validServerEnv);

    expect(env.NODE_ENV).toBe("development");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("rejects an invalid NODE_ENV", () => {
    expect(() =>
      parseServerEnv({ ...validServerEnv, NODE_ENV: "qa" }),
    ).toThrow(/Invalid server environment/);
  });

  it("applies public defaults and validates public URLs", () => {
    expect(parsePublicEnv({}).NEXT_PUBLIC_APP_URL).toBe(
      "http://localhost:3000",
    );
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_APP_URL: "not a url" }),
    ).toThrow(/Invalid public environment/);
  });
});
