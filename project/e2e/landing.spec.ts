import { expect, test } from "@playwright/test"

test("landing page loads", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/GenZpace/i)
})

test("sign-in page renders", async ({ page }) => {
  await page.goto("/sign-in")
  await expect(page.locator("body")).toBeVisible()
})
