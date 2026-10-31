import { chromium, expect } from "@playwright/test";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:4336";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});
const page = await browser.newPage({ viewport: { width: 375, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const shot = async (name, element) => {
  await element.screenshot({
    path: `docs/frontend/screens/flows/mobile-${name}-375.png`,
  });
};
await page.goto(base + "/app/");
await expect(page.locator("h1")).toHaveText("Overview");
await page.evaluate(() => document.fonts.ready);
await shot("overview-indices", page.locator(".owned-index-section"));
await shot("chart-compact", page.locator(".portfolio-history"));
await page.getByRole("button", { name: "Chart options", exact: true }).click();
await shot("chart-options", page.locator(".portfolio-history"));
const insights = page.getByRole("region", {
  name: "Portfolio insights",
  exact: true,
});
await shot("insights-monthly", insights);
await insights
  .getByRole("button", { name: "Next slide: Portfolio insights", exact: true })
  .click();
await expect(insights.locator(".mobile-carousel-count")).toHaveText("2 / 3");
await shot("insights-exposure", insights);
await insights
  .getByRole("button", { name: "Next slide: Portfolio insights", exact: true })
  .click();
await expect(insights.locator(".mobile-carousel-count")).toHaveText("3 / 3");
await shot("insights-activity", insights);
await page.goto(base + "/app/wallets/");
await expect(page.locator("h1")).toHaveText("Wallet");
await page.evaluate(() => document.fonts.ready);
await shot("wallet-indices", page.locator(".wallet-mobile-indices"));
await shot("wallet-currencies", page.locator(".asset-wallet-table"));
await browser.close();
if (errors.length) throw Error(errors.join("\n"));
console.log(
  "Captured eight mobile carousel/table states without runtime errors",
);
