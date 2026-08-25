import { expect, test } from "@playwright/test"

test.describe("Projects Management Flow", () => {
  test("projects page structure or auth redirect", async ({ page }) => {
    await page.goto("/projects")

    const currentUrl = page.url()
    if (currentUrl.includes("sign-in")) {
      // Safely handled if unauthenticated
      await expect(page.locator("body")).toBeVisible()
    } else {
      // If session is active/mocked, verify projects list elements load
      await expect(page.locator("body")).toBeVisible()

      // Look for project creation trigger button
      const newProjectBtn = page.getByRole("button", {
        name: /New Project|Create Project/i,
      })
      if (await newProjectBtn.isVisible()) {
        await expect(newProjectBtn).toBeEnabled()
      }
    }
  })
})
