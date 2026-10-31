import { chromium } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
fs.mkdirSync("docs/frontend/screens/flows", { recursive: true });
for (const width of [1440, 375]) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(
    "http://127.0.0.1:4322/app/strategy-lab/?index=tbci-20-utility",
  );
  await page.locator(".lab-index-name").waitFor();
  await page.locator('.lab-comparison-chart[data-ready="true"]').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `docs/frontend/screens/flows/strategy-lab-${width}.png`,
    fullPage: true,
  });
}
await page.goto("http://127.0.0.1:4322/app/wallets/");
await page.setViewportSize({ width: 1440, height: 1000 });
await page.locator(".asset-wallet-table").waitFor();
await page.screenshot({
  path: "docs/frontend/screens/flows/wallet-grouped-1440.png",
  fullPage: true,
});
await browser.close();
if (errors.length) throw Error(errors.join("\n"));
