import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("account theme preference contract", () => {
  const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
  const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
  const db = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
  const context = readFileSync(resolve(process.cwd(), "client/src/contexts/ThemeContext.tsx"), "utf8");

  it("stores only the supported theme preferences with system as the default", () => {
    expect(schema).toContain('themePreference: mysqlEnum("themePreference", ["light", "dark", "system"])');
    expect(schema).toContain('.default("system").notNull()');
  });

  it("scopes updates to the authenticated user through a protected procedure", () => {
    expect(router).toContain('setThemePreference: protectedProcedure.input(z.enum(["light", "dark", "system"]))');
    expect(router).toContain("updateUserThemePreference(ctx.user.id, input)");
    expect(db).toContain('export async function updateUserThemePreference(userId: number, themePreference: "light" | "dark" | "system")');
  });

  it("hydrates the account preference and persists later manual changes", () => {
    expect(context).toContain("authMe = trpc.auth.me.useQuery");
    expect(context).toContain("user.themePreference");
    expect(context).toContain("persistThemePreference(nextPreference)");
    expect(context).toContain("lastSyncedUserId");
    expect(context).not.toContain("persistThemePreference(preference");
    expect(context).not.toContain("lastPersistedPreference");
    expect(context).not.toContain("skipNextPersist");
  });
});

