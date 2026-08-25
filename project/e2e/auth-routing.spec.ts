import { expect, test } from "@playwright/test"

test.describe("Auth & Routing Guard Suite", () => {
  test("landing page loads successfully", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL(/localhost:3000/)
    await expect(page.locator("body")).toBeVisible()
  })

  test("sign-in and sign-up routes render correctly", async ({ page }) => {
    await page.goto("/sign-in")
    await expect(page).toHaveURL(/sign-in/)
    await expect(page.locator("body")).toBeVisible()
    await page.goto("/sign-up")
    await expect(page).toHaveURL(/sign-up/)
    await expect(page.locator("body")).toBeVisible()
  })

  // Isolated unauthenticated scope to properly test route guards
  test.describe("unauthenticated", () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test("protected routes redirect unauthenticated users to sign-in", async ({
      page,
    }) => {
      await page.goto("/dashboard")
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 })

      await page.goto("/projects")
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 })
    })
  })
})
