import { expect, test } from "@playwright/test"

test.describe("Chained Critical User Journey (#36)", () => {
  test("sign-in session -> create project -> create task -> drag task -> sign-out", async ({
    page,
  }) => {
    test.setTimeout(90_000) // Prevent 30s timeout on heavy chained flow

    const projectName = `E2E Test Project ${Date.now()}`
    const taskTitle = `E2E Task ${Date.now()}`

    // 1. Authenticated session injected via globalSetup — land on dashboard
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/dashboard/)

    // 2. Navigate to projects and create a project
    await page.goto("/projects")
    await page
      .getByRole("button", { name: /New Project|Create Project/i })
      .click()
    await page.getByLabel(/Project Name/i).fill(projectName)

    // Flexible button selector match
    await page
      .getByRole("button", { name: /Create|Save|Submit/i })
      .first()
      .click()

    // 💡 FIX: Wait for the modal/form dialog to disappear or network to idle
    await page.waitForLoadState("networkidle")

    // Assert project persisted in the list with a generous timeout
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10_000 })

    // 3. Open the project board
    await page.getByText(projectName).click()
    await expect(page).toHaveURL(/\/projects\/.+/)

    // 4. Create a task in the first column list
    const firstList = page.locator('[data-testid="list-column"]').first()
    await firstList.getByRole("button", { name: /Add a task/i }).click()

    const taskInput = firstList.getByPlaceholder("Enter a title")
    await expect(taskInput).toBeVisible()
    await taskInput.fill(taskTitle)

    await firstList.getByRole("button", { name: /^Add task$/i }).click()
    await expect(page.getByText(taskTitle)).toBeVisible()

    // 5. Drag the task from list 0 to list 1 using data-testid="list-column"
    const sourceTask = page.getByText(taskTitle)
    const lists = page.locator('[data-testid="list-column"]')

    const listCount = await lists.count()
    expect(listCount).toBeGreaterThanOrEqual(2)
    const targetList = lists.nth(1)

    const sourceBox = await sourceTask.boundingBox()
    const targetBox = await targetList.boundingBox()
    if (!sourceBox || !targetBox) {
      throw new Error("Could not locate drag source/target bounding boxes")
    }

    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2,
    )
    await page.mouse.down()
    await page.mouse.move(
      sourceBox.x + sourceBox.width / 2 + 10,
      sourceBox.y + sourceBox.height / 2,
      { steps: 5 },
    )
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 10 },
    )
    await page.mouse.up()

    await expect(targetList.getByText(taskTitle)).toBeVisible()

    // 6. Sign out
    await page.getByRole("button", { name: /User menu/i }).click()
    await page.getByRole("menuitem", { name: /Log out/i }).click()

    await page.waitForURL(/\/(sign-in|$)/)
  })
})
