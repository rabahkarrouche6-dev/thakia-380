import { test, expect } from "@playwright/test";

const runProtected = process.env.E2E_PROTECTED === "1";

test.describe("Smart Tenders procurement journey", () => {
  test("public landing exposes the three institutional entry points", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/صفقات|Smart Tenders/i);
    await expect(page.getByText(/المتعامل الاقتصادي/).first()).toBeVisible();
    await expect(page.getByText(/المصلحة المتعاقدة/).first()).toBeVisible();
    await expect(page.getByText(/الإدارة المركزية/).first()).toBeVisible();
  });

  test("portal selection preserves role-specific login context", async ({ page }) => {
    await page.goto("/login/authority");
    await expect(page).toHaveURL(/\/login\/authority/);
    await expect(page.getByRole("heading", { name: /المصلحة المتعاقدة|contracting authority/i })).toBeVisible();
    await expect(page.getByText(/بوابة المصلحة المتعاقدة/).first()).toBeVisible();
    await expect(page.getByText(/المصلحة المتعاقدة/).first()).toBeVisible();
  });

  test("protected procurement journey is executable with an explicitly provisioned session", async ({ page }) => {
    test.skip(!runProtected, "Set E2E_PROTECTED=1 with a provisioned authenticated browser session to run protected workflow assertions.");
    await page.goto("/app");
    await expect(page).toHaveURL(/\/app/);
    await expect(page.getByText(/مساحة المصلحة المتعاقدة|مساحة المتعامل الاقتصادي|central administration/i).first()).toBeVisible();

    // The assertions deliberately follow visible user-facing milestones only.
    // They do not auto-approve, award, or make any irreversible procurement decision.
    await expect(page.getByText(/الصفقات|tenders/i).first()).toBeVisible();
  });
});
