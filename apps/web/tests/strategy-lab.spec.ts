import { test, expect } from "@playwright/test";
import { backtest, stressLoss, correlation } from "../src/data/strategy-lab";
import { indexBasket, allIndices } from "../src/data/portfolio";
import { seriesFor } from "../src/data/market";

test("basket buy and hold reconciles to component returns and fees", () => {
  for (const index of allIndices) {
    const initial = 10000,
      days = 90;
    const gross = indexBasket(index.id).reduce((s, a) => {
      const h = seriesFor(a.symbol).slice(-days);
      return s + (((initial * a.weight) / 100) * h.at(-1)!.close) / h[0].close;
    }, 0);
    const free = backtest(index.id, { initial, days, fee: 0, rebalance: 0 });
    expect(free.final).toBeCloseTo(gross, 7);
    expect(free.fees).toBe(0);
    expect(free.log).toHaveLength(0);
    const paid = backtest(index.id, { initial, days, fee: 1, rebalance: 0 });
    expect(paid.final).toBeCloseTo(gross * 0.99 * 0.99, 7);
    expect(paid.fees).toBeCloseTo(initial * 0.01 + gross * 0.99 * 0.01, 7);
    const doubled = backtest(index.id, {
      initial: initial * 2,
      days,
      fee: 1,
      rebalance: 7,
    });
    const single = backtest(index.id, { initial, days, fee: 1, rebalance: 7 });
    expect(doubled.final).toBeCloseTo(single.final * 2, 7);
    expect(doubled.netReturn).toBeCloseTo(single.netReturn, 7);
    expect(single.log).toHaveLength(12);
    for (const row of single.log)
      expect(row.fee).toBeCloseTo(row.turnover * 0.01, 7);
    expect(single.maxDrawdown).toBeLessThanOrEqual(0);
    expect(Number.isFinite(single.volatility)).toBe(true);
  }
});
test("stress contributions reconcile and correlations have expected limits", () => {
  const c = [
    { symbol: "BTC", weight: 60 },
    { symbol: "ETH", weight: 40 },
  ];
  expect(stressLoss(c, 30, "all", 10000).reduce((s, a) => s + a.loss, 0)).toBe(
    3000,
  );
  expect(stressLoss(c, 50, "ETH", 10000)[0]).toEqual({
    symbol: "ETH",
    loss: 2000,
  });
  expect(stressLoss(c, 0).every((a) => a.loss === 0)).toBe(true);
  expect(correlation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
  expect(correlation([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1);
});
test("lab links, index choice, parameters and mobile layout work", async ({
  page,
}) => {
  await page.goto("/app/indices/");
  const card = page
    .locator(".choice-card")
    .filter({ hasText: "TBCi-10 Stable" });
  await card
    .getByRole("button", { name: "Index Strategy Lab", exact: true })
    .click();
  await expect(page).toHaveURL(/strategy-lab\/\?index=tbci-10-stable/);
  await expect(page.getByLabel("Choice index", { exact: true })).toHaveValue(
    "tbci-10-stable",
  );
  const before = await page.getByTestId("Final value").innerText();
  await page
    .getByLabel("Choice index", { exact: true })
    .selectOption("tbci-20-utility");
  await expect(page.getByTestId("Final value")).not.toHaveText(before);
  await expect(page.locator(".lab-intro h2")).toHaveText("TBCi-20 Utility");
  await page.getByLabel("Rebalance rule").selectOption("0");
  await expect(
    page.getByText("No rebalances under Buy and hold."),
  ).toBeVisible();
  await page.getByLabel("Initial amount", { exact: true }).fill("20000");
  await page.getByLabel("Trading fee", { exact: true }).fill("0");
  await expect(page.getByTestId("Total fees")).toHaveText("$0.00");
  await page.getByLabel("Shock target").selectOption("BTC");
  await page.getByLabel("Price decline").fill("0");
  await expect(page.getByTestId("stress-loss")).toHaveText("$0.00 (0%)");
  for (const width of [320, 375, 767, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
  await page.reload();
  await expect(page.getByLabel("Choice index", { exact: true })).toHaveValue(
    "tbci-20-utility",
  );
  await page.goto("/app/");
  // Overview menu retains index-specific destinations.
  const link = page.locator('a[href^="/app/strategy-lab/?index="]').first();
  await expect(link).toHaveAttribute("href", /index=tbci-/);
  await page.goto("/app/wallets/");
  await page
    .locator('.asset-wallet-table [data-kind="index"]')
    .first()
    .getByRole("button", { name: /^Details/ })
    .click();
  await page
    .getByRole("link", { name: "Index Strategy Lab", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("Index Strategy Lab");
});
test("desktop wallet sorts within index and currency groups", async ({
  page,
}) => {
  await page.goto("/app/wallets/");
  for (const sort of ["value", "name", "balance"]) {
    await page.getByLabel("Sort wallet assets").selectOption(sort);
    const kinds = await page
      .locator(".asset-wallet-table tbody tr")
      .evaluateAll((rows) => rows.map((r) => r.getAttribute("data-kind")));
    expect(kinds.slice(0, 7)).toEqual(Array(7).fill("index"));
    expect(kinds.slice(7)).not.toContain("index");
  }
});
test("social previews use absolute images and retain noindex", async ({
  page,
  request,
}) => {
  for (const route of [
    "/",
    "/app/strategy-lab/",
    "/index/tbci-20-utility/",
    "/coins/bitcoin/",
    "/news/",
  ]) {
    await page.goto(route);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    const title = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(title).not.toMatch(/demo|tbci-20-utility/i);
    const image = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(image).toMatch(/^https:\/\/tbci.pavelml.ru\/social\//);
    const local = await request.get(new URL(image!).pathname);
    expect(local.ok()).toBe(true);
    expect(local.headers()["content-type"]).toContain("image/png");
    expect(
      await page
        .locator('meta[property="og:description"]')
        .getAttribute("content"),
    ).not.toMatch(/demo|simulat/i);
  }
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("User-agent: TelegramBot\nAllow: /");
  expect(robots).toContain("User-agent: *\nDisallow: /");
});
