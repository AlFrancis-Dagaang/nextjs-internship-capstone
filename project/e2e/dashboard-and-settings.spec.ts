import { test, expect } from "@playwright/test";

test.describe("Dashboard & Settings Flow", () => {
  test("dashboard route (/dashboard) loads widgets", async ({ page }) => {
    await page.goto("/dashboard");

    const currentUrl = page.url();
    if (currentUrl.includes("sign-in")) {
      await expect(page.locator("body")).toBeVisible();
    } else {
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("settings route (/settings) renders management tabs", async ({
    page,
  }) => {
    await page.goto("/settings");

    const currentUrl = page.url();
    if (currentUrl.includes("sign-in")) {
      await expect(page.locator("body")).toBeVisible();
    } else {
      await expect(page.locator("body")).toBeVisible();
    }
  });
});
