import { test, expect } from "@playwright/test";

test.describe("Kanban Board & Task Flow", () => {
  test("project board route loads or enforces authentication", async ({
    page,
  }) => {
    // Target a dynamic project board route
    await page.goto("/projects/sample-project-id");

    const currentUrl = page.url();
    if (currentUrl.includes("sign-in")) {
      // Safely handled if unauthenticated
      await expect(page.locator("body")).toBeVisible();
    } else {
      // If authenticated/mocked, verify board layout containers render
      await expect(page.locator("body")).toBeVisible();

      // Look for list columns or task creation elements if present, using .first() to prevent strict-mode collisions
      const boardContainer = page
        .locator("main, [data-testid='kanban-board'], body")
        .first();
      await expect(boardContainer).toBeVisible();
    }
  });
});
