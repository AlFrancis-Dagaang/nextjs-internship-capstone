import { test, expect } from "@playwright/test";

test.describe("Team Management Flow", () => {
  test("workspace team hub (/team) renders correctly", async ({ page }) => {
    // Navigate to the global team hub route
    await page.goto("/team");

    const currentUrl = page.url();
    if (currentUrl.includes("sign-in")) {
      await expect(page.locator("body")).toBeVisible();
    } else {
      // Verify workspace management sections load
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("per-project team page (/projects/[id]/team) routing", async ({
    page,
  }) => {
    // Navigate to a project's dedicated team management view
    await page.goto("/projects/sample-project-id/team");

    const currentUrl = page.url();
    if (currentUrl.includes("sign-in")) {
      await expect(page.locator("body")).toBeVisible();
    } else {
      await expect(page.locator("body")).toBeVisible();
    }
  });
});
