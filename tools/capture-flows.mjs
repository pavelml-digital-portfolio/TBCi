import { chromium } from "@playwright/test";
import fs from "node:fs";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:4335";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});
const results = [];
for (const width of [375, 1496]) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  const open = async (route) => {
    await page.goto(base + route);
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
  };
  const shot = async (name) => {
    const dialog = page.getByRole("dialog");
    const geometry = await dialog.evaluate((e) => ({
      width: e.clientWidth,
      scroll: e.scrollWidth,
      left: e.getBoundingClientRect().left,
      right: e.getBoundingClientRect().right,
    }));
    if (
      geometry.scroll > geometry.width + 1 ||
      geometry.left < 0 ||
      geometry.right > width
    )
      throw Error(name + " dialog overflow " + JSON.stringify(geometry));
    const file = "flow-" + name + "-" + width + ".png";
    await page.screenshot({ path: "docs/frontend/screens/flows/" + file });
    results.push({ file, width, geometry });
  };
  await open("/app/wallets/");
  if (width < 768)
    await page
      .getByRole("button", { name: "Actions for BTC", exact: true })
      .click();
  await page.getByRole("button", { name: "Deposit BTC", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator(".wallet-qr img").waitFor();
  await shot("deposit-qr");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  if (width < 768)
    await page
      .getByRole("button", { name: "Actions for BTC", exact: true })
      .click();
  await page.getByRole("button", { name: "Withdraw BTC", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Use a sample recipient", exact: true })
    .click();
  await page.getByLabel("Amount, BTC", { exact: true }).fill(".01");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await shot("withdraw-review");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await open("/app/settings/#verification");
  await page.getByRole("button", { name: /Upgrade to Level 3/ }).click();
  await shot("kyc-personal");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Use sample document", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Simulate selfie check", exact: true })
    .click();
  await shot("kyc-identity");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Use sample document", exact: true })
    .click();
  await shot("kyc-address");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await shot("kyc-review");
  await page.close();
}
fs.writeFileSync(
  "docs/frontend/FLOW_REVIEW.json",
  JSON.stringify({ results }, null, 2) + "\n",
);
await browser.close();
console.log("Captured", results.length, "flow screens without dialog overflow");
