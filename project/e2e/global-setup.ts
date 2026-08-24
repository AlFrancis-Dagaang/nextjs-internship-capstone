import { chromium, type FullConfig } from "@playwright/test";
import { clerkSetup, clerk } from "@clerk/testing/playwright";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default async function globalSetup(config: FullConfig) {
  await clerkSetup();

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = config.projects[0].use.baseURL || "http://localhost:3000";

  // Must land on an unprotected page that loads Clerk before signing in
  await page.goto(baseURL);

  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_TEST_EMAIL!,
  });

  // Confirm the session actually took before saving it
  await page.goto(`${baseURL}/dashboard`);
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });

  // Pre-warm key routes to prevent cold-compile timeouts during parallel test execution
  await page.goto(`${baseURL}/projects`, { waitUntil: "domcontentloaded" });
  await page.goto(`${baseURL}/calendar`, { waitUntil: "domcontentloaded" });
  await page.goto(`${baseURL}/team`, { waitUntil: "domcontentloaded" });
  await page.goto(`${baseURL}/analytics`, { waitUntil: "domcontentloaded" });

  await page.context().storageState({ path: "e2e/.auth/user.json" });
  await browser.close();
}
