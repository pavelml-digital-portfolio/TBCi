import { test, expect, type Page } from "@playwright/test";
import { seed, basket, findIndex } from "../src/data/demo";
import {
  executeIndexTrade,
  executeAssetConversion,
} from "../src/data/index-trading";
import {
  accountTotals,
  ownedIndices,
  underlyingExposure,
  indexBasket,
  portfolioSeries,
  exposureTiles,
  reservedBalance,
} from "../src/data/portfolio";
import {
  createTransfer,
  failTransfer,
  progressTransfers,
} from "../src/data/transfer-engine";
import { networksFor, mockAddress } from "../src/data/wallet";
const key = "tbci-reference-demo-v2";
const stored = (p: Page) =>
  p.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}"), key);
const open = async (p: Page, path: string) => {
  await p.goto(path);
  await p.getByRole("heading", { level: 1 }).waitFor();
  await expect(p.locator("astro-island[ssr]")).toHaveCount(0);
};
test("multi-index trades affect only the named holding, preserve fees and reject duplicates", () => {
  const s = structuredClone(seed),
    before = accountTotals(s);
  const indexId = "tbci-20-security";
  const bought = executeIndexTrade(s, "buy", 2, "USD", indexId, "buy-once");
  expect(bought.error).toBeUndefined();
  expect(bought.state.tokenBalances[indexId]).toBe(2);
  expect(bought.state.balances.TBCi).toBe(s.balances.TBCi);
  expect(bought.state.tokenBalances["tbci-10-stable"]).toBe(
    s.tokenBalances["tbci-10-stable"],
  );
  expect(bought.state.balances.USD).toBeCloseTo(
    s.balances.USD - 2 * findIndex(indexId).price * 1.005,
    8,
  );
  expect(accountTotals(bought.state).total).toBeCloseTo(
    before.total - 2 * findIndex(indexId).price * 0.005,
    6,
  );
  expect(
    executeIndexTrade(bought.state, "buy", 2, "USD", indexId, "buy-once").state,
  ).toBe(bought.state);
  const sold = executeIndexTrade(
    bought.state,
    "sell",
    1,
    "ETH",
    indexId,
    "sell-once",
  );
  expect(sold.state.tokenBalances[indexId]).toBe(1);
  expect(sold.state.balances.ETH).toBeCloseTo(
    s.balances.ETH + (findIndex(indexId).price * 0.995) / 208.1,
    8,
  );
  expect(sold.state.operations[0].indexId).toBe(indexId);
  expect(
    executeIndexTrade(sold.state, "sell", 2, "USD", indexId).error,
  ).toMatch(/Insufficient/);
});
test("aggregate holdings, look-through exposure and model series reconcile without double counting", () => {
  const s = structuredClone(seed),
    holdings = ownedIndices(s),
    total = holdings.reduce((n, h) => n + h.value, 0),
    exposure = underlyingExposure(holdings);
  expect(holdings).toHaveLength(5);
  expect(exposure.reduce((n, a) => n + a.value, 0)).toBeCloseTo(total, 6);
  for (const id of ["tbci-20-stable", "tbci-10-stable", "tbci-50-active"])
    expect(indexBasket(id).reduce((n, a) => n + a.weight, 0)).toBeCloseTo(
      100,
      10,
    );
  expect(indexBasket("tbci-10-stable")).toHaveLength(10);
  indexBasket("tbci-20-stable").forEach((a, i) =>
    expect(a.weight).toBeCloseTo(basket[i].weight, 12),
  );
  expect(portfolioSeries(holdings).at(-1)!.close).toBeCloseTo(total, 6);
  expect(portfolioSeries([holdings[0]]).at(-1)!.close).toBeCloseTo(
    holdings[0].value,
    6,
  );
  const tiles = exposureTiles(exposure);
  expect(tiles.reduce((n, t) => n + t.width * t.height, 0)).toBeCloseTo(
    600 * 250,
    5,
  );
  for (const t of tiles) {
    expect(t.x).toBeGreaterThanOrEqual(0);
    expect(t.x + t.width).toBeLessThanOrEqual(600.0001);
    expect(t.y + t.height).toBeLessThanOrEqual(250.0001);
  }
  s.balances.TBCi = 999999999;
  expect(accountTotals(s).indices).toBeCloseTo(total, 6);
});
test("pending outgoing principal and native fee are reserved and returned exactly once", () => {
  const s = structuredClone(seed),
    n = networksFor("USDT")[0],
    now = Date.now(),
    before = accountTotals(s);
  const pending = createTransfer(
    s,
    {
      requestId: "reserved",
      kind: "withdraw",
      symbol: "USDT",
      network: n.id,
      address: mockAddress(n, "reserve-test"),
      amount: 10,
      memo: "",
    },
    now,
  );
  expect(pending.error).toBeUndefined();
  expect(reservedBalance(pending.state, "USDT")).toBe(10);
  expect(reservedBalance(pending.state, "ETH")).toBe(0.0003);
  expect(accountTotals(pending.state).total).toBeCloseTo(before.total, 5);
  const refunded = failTransfer(pending.state, pending.transfer!.id);
  expect(accountTotals(refunded).total).toBeCloseTo(before.total, 5);
  expect(reservedBalance(refunded, "USDT")).toBe(0);
  const completed = progressTransfers(pending.state, now + 10000);
  expect(accountTotals(completed).reserved).toBe(0);
  expect(accountTotals(completed).total).toBeCloseTo(
    before.total - 10 - 0.0003 * 208.1,
    5,
  );
});
test("My Wallet shows every owned index and filters composition and all portfolio analytics", async ({
  page,
}) => {
  await open(page, "/app/");
  await expect(page.locator("h1")).toHaveText("My Wallet");
  await expect(page.locator(".owned-index-card")).toHaveCount(5);
  await expect(
    page
      .locator(".account-sidebar nav")
      .getByRole("link", { name: "Buy index", exact: true }),
  ).toHaveCount(0);
  const before = Number(
    await page.locator(".trading-widget").getAttribute("data-bar-count"),
  );
  expect(before).toBe(365);
  const beforeValue = await page.locator(".portfolio-filter-panel").innerText();
  for (const name of [
    "TBCi-20 Stable",
    "TBCi-20 Balance",
    "TBCi-50 Active",
    "TBCi-20 Utility",
  ])
    await page.getByRole("checkbox", { name, exact: true }).uncheck();
  await expect(page.locator(".portfolio-filter-panel")).not.toHaveText(
    beforeValue,
  );
  await page.getByRole("button", { name: "By index", exact: true }).click();
  await expect(page.locator(".portfolio-composition-list>button")).toHaveCount(
    1,
  );
  await expect(page.locator(".portfolio-composition-list")).toContainText(
    "TBCi-10 Stable",
  );
  await expect(page.locator(".exposure-map .settings-badge")).toContainText(
    "10 assets",
  );
  await expect(page.locator(".trading-widget")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page
    .getByRole("checkbox", { name: "TBCi-10 Stable", exact: true })
    .uncheck();
  await expect(page.locator(".portfolio-history")).toContainText(
    "Select at least one index",
  );
  await page
    .getByRole("button", { name: "Show all indices", exact: true })
    .click();
  await expect(page.locator(".portfolio-composition-list>button")).toHaveCount(
    5,
  );
});
test("buy and sell another index inline preserve other holdings and update cards after reload", async ({
  page,
}) => {
  await open(page, "/app/");
  const before = await stored(page);
  await page.getByRole("button", { name: "Buy index", exact: true }).click();
  await page
    .getByLabel("Index", { exact: true })
    .selectOption("tbci-20-security");
  await page.getByLabel("Amount TBCi", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Review buy", exact: true }).click();
  await page.getByRole("button", { name: "Confirm buy", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator(".owned-index-card")).toHaveCount(6);
  expect((await stored(page)).tokenBalances["tbci-20-stable"]).toBe(
    before.tokenBalances["tbci-20-stable"],
  );
  await page
    .getByRole("button", { name: "Sell TBCi-20 Security", exact: true })
    .click();
  await page.getByRole("button", { name: "MAX", exact: true }).click();
  await page.getByRole("button", { name: "Review sell", exact: true }).click();
  await page.getByRole("button", { name: "Confirm sell", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.locator(".owned-index-card")).toHaveCount(5);
  await page.reload();
  await expect(page.locator(".owned-index-card")).toHaveCount(5);
  expect((await stored(page)).tokenBalances["tbci-20-security"]).toBe(0);
});
test("Wallet contains every asset, zero filter, categories, details, export and links to index trades", async ({
  page,
}) => {
  await open(page, "/app/wallets/");
  await expect(page.locator("h1")).toHaveText("Wallet");
  await expect(page.locator(".asset-wallet-table tbody tr")).toHaveCount(28);
  await expect(page.locator(".trading-widget")).toHaveCount(0);
  await expect(page.locator(".owned-index-grid")).toHaveCount(0);
  await page
    .getByRole("checkbox", { name: "Hide zero balances", exact: true })
    .check();
  await expect(page.locator(".asset-wallet-table tbody tr")).toHaveCount(26);
  await page.getByRole("button", { name: /^Indices/ }).click();
  await expect(page.locator(".asset-wallet-table tbody tr")).toHaveCount(5);
  await page.getByRole("button", { name: /^Crypto/ }).click();
  await page.getByLabel("Search wallet assets").fill("IOTA");
  await expect(page.locator(".asset-wallet-table tbody tr")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Deposit IOTA", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Details Iota", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Supported demo networks",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export balances", exact: true })
    .click();
  expect((await dl).suggestedFilename()).toBe("tbci-wallet-balances.csv");
  await page.getByLabel("Search wallet assets").fill("");
  await page.getByRole("button", { name: /^Indices/ }).click();
  await page
    .locator('[data-asset="tbci-10-stable"]')
    .getByRole("link", { name: "Buy", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText("My Wallet");
  await expect(page.getByLabel("Index", { exact: true })).toHaveValue(
    "tbci-10-stable",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect(page.locator(".owned-index-card")).toHaveCount(5);
});
test("legacy buy and sell URLs route to inline trading; devices remain aligned at every breakpoint", async ({
  page,
}) => {
  for (const action of ["buy", "sell"]) {
    await page.goto("/app/" + action + "/");
    await page.waitForURL((u) => u.pathname === "/app/");
    await expect(page.locator("h1")).toHaveText("My Wallet");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
  }
  for (const width of [320, 375, 677, 768, 1024, 1496, 1920, 2560]) {
    await page.setViewportSize({ width, height: 950 });
    await open(page, "/app/settings/#devices");
    await expect(page.locator(".settings-devices>article")).toHaveCount(3);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const collisions = await page
      .locator(".settings-devices>article")
      .evaluateAll((nodes) =>
        nodes.some((n) => {
          const info = n.querySelector("div")!.getBoundingClientRect(),
            button = n.lastElementChild!.getBoundingClientRect();
          return (
            Math.min(info.right, button.right) >
              Math.max(info.left, button.left) + 1 &&
            Math.min(info.bottom, button.bottom) >
              Math.max(info.top, button.top) + 1
          );
        }),
      );
    expect(collisions).toBe(false);
  }
});

test("internal conversion is atomic, charges one fee and leaves every index untouched", () => {
  const s = structuredClone(seed),
    before = accountTotals(s).total;
  const result = executeAssetConversion(s, "USD", "ETH", 100, "convert-once");
  expect(result.error).toBeUndefined();
  expect(result.state.balances.USD).toBe(s.balances.USD - 100);
  expect(result.state.balances.ETH).toBeCloseTo(
    s.balances.ETH + 99.5 / 208.1,
    7,
  );
  expect(result.state.tokenBalances).toEqual(s.tokenBalances);
  expect(accountTotals(result.state).total).toBeCloseTo(before - 0.5, 4);
  expect(
    executeAssetConversion(result.state, "USD", "ETH", 100, "convert-once")
      .state,
  ).toBe(result.state);
  expect(executeAssetConversion(s, "USD", "USD", 1, "bad").error).toMatch(
    /different/,
  );
  s.kyc.level = 1;
  expect(executeAssetConversion(s, "USD", "ETH", 10, "blocked").error).toMatch(
    /Buy only/,
  );
});
test("wallet conversion review changes only the two assets and balances can be hidden", async ({
  page,
}) => {
  await open(page, "/app/wallets/");
  const before = await stored(page);
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await page.getByLabel("Convert to", { exact: true }).selectOption("ETH");
  await page.getByLabel("Conversion amount", { exact: true }).fill("100");
  await page
    .getByRole("button", { name: "Review conversion", exact: true })
    .click();
  expect((await stored(page)).balances.USD).toBe(before.balances.USD);
  await page
    .getByRole("button", { name: "Confirm conversion", exact: true })
    .click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  expect((await stored(page)).balances.USD).toBe(before.balances.USD - 100);
  await expect(
    page.getByRole("heading", { name: "Recent conversions", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hide balances", exact: true })
    .click();
  await expect(page.locator(".portfolio-totals")).toContainText("••••");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Show balances", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show balances", exact: true })
    .click();
  await page
    .getByLabel("Display currency", { exact: true })
    .selectOption("BTC");
  await expect(page.locator(".portfolio-totals")).toContainText("BTC");
});
