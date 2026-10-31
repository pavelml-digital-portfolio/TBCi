import { test, expect, type Page } from "@playwright/test";
const stored = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("tbci-reference-demo-v2") || "{}"),
  );
const open = async (page: Page, path: string) => {
  await page.goto(path);
  if (/\/app\/(buy|sell)\//.test(path))
    await page.waitForURL((url) => url.pathname === "/app/");
  await page.locator("h1").waitFor();
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
};
const price = 92844.234 / 2353;
const refs: [string, string][] = [
  ["/", "PUB-01"],
  ["/index/tbci-20-balance/", "PUB-03"],
  ["/coins/", "PUB-06"],
  ["/coins/bitcoin/", "PUB-07"],
  ["/coins/bitcoin/charts/", "PUB-08"],
  ["/coins/bitcoin/historical-price/", "PUB-09"],
  ["/coins/bitcoin/markets/", "PUB-10"],
  ["/coins/bitcoin/news/", "PUB-11"],
  ["/exchanges/", "PUB-04"],
  ["/exchanges/huobi/", "PUB-05"],
  ["/news/", "PUB-13"],
  ["/news/huobi-stablecoin/", "PUB-14"],
  ["/app/wallets/", "CAB-01"],
  ["/app/indices/", "CAB-02"],
  ["/app/", "CAB-03"],
  ["/app/compile/", "CAB-05"],
  ["/app/unmake/", "CAB-07"],
  ["/app/history/", "CAB-08"],
  ["/app/holders/", "CAB-09"],
];
test("19 active reference screens load without runtime errors and keep noindex", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [path, id] of refs) {
    await open(page, path);
    await expect(
      page.locator('[data-mockup="' + id + '"]').first(),
    ).toBeVisible();
    await expect(page.locator("meta[name=robots]")).toHaveAttribute(
      "content",
      /noindex/,
    );
  }
  expect(errors).toEqual([]);
});
test("source landing sections, composition expansion, direct login and demo newsletter", async ({
  page,
}) => {
  await open(page, "/");
  await expect(
    page.getByRole("heading", { name: /Tugush Blockchain Capital index/ }),
  ).toBeVisible();
  await expect(page.locator(".home-news .news-card")).toHaveCount(6);
  await page.getByRole("button", { name: /View All Coins/ }).click();
  await expect(page.locator(".intro-grid tbody tr")).toHaveCount(20);
  await page.getByLabel("Your email", { exact: true }).fill("demo@example.com");
  await page.getByRole("button", { name: "Subscribe", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Subscription preferences updated");
  await page.getByRole("link", { name: "Login", exact: true }).click();
  await expect(page).toHaveURL(/\/app\/$/);
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await expect(page.locator("input[type=password]")).toHaveCount(0);
});
test("coins have five original filters, working search and persistent watchlist", async ({
  page,
}) => {
  await open(page, "/coins/");
  await expect(page.locator(".coin-filters select")).toHaveCount(5);
  await expect(page.locator(".currency-table thead th")).toHaveCount(10);
  await page
    .getByRole("button", { name: "Add BTC to watchlist", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Remove BTC from watchlist",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Watchlist", exact: true }).click();
  await expect(page.locator(".currency-table tbody tr")).toHaveCount(3);
  await page.getByLabel("Market Cap filter").selectOption("large");
  await expect(page.locator(".currency-table tbody tr")).toHaveCount(3);
  await page
    .getByRole("searchbox", { name: "Search coins", exact: true })
    .fill("Bitcoin");
  await page
    .getByRole("searchbox", { name: "Search coins", exact: true })
    .press("Enter");
  await expect(page).toHaveURL(/q=Bitcoin/);
  await expect(page.locator(".currency-table tbody tr")).toHaveCount(2);
});
test("index composition fields and calculator follow the source screen", async ({
  page,
}) => {
  await open(page, "/index/tbci-20-balance/");
  await expect(page.locator(".currency-table thead th")).toHaveText([
    "Currency",
    "Market cap",
    "Share of portfolio",
    "Price",
    "Value of share",
  ]);
  const result = page.getByRole("status", { name: "Investment return" });
  const before = await result.innerText();
  await page.getByLabel("Initial investment", { exact: true }).fill("10000");
  await expect(result).not.toHaveText(before);
  await page.getByLabel("Add coins to comparison").fill("ETH");
  await page
    .getByRole("button", { name: "Add comparison", exact: true })
    .click();
  await expect(page.locator("button[data-comparison=ETH]")).toHaveCount(1);
  await page.getByRole("button", { name: "Remove ETH comparison" }).click();
  await expect(page.locator("button[data-comparison=ETH]")).toHaveCount(0);
});
test("coin tabs, converter, price period and news filters work", async ({
  page,
}) => {
  await open(page, "/coins/bitcoin/");
  await page.getByLabel("Convert amount").fill("2");
  await expect(page.getByLabel("Converted value")).toContainText("11,150");
  await page
    .locator(".coin-tabs")
    .getByRole("link", { name: "Historical price", exact: true })
    .click();
  await page.getByLabel("From", { exact: true }).fill("2018-11-19");
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page
    .locator(".coin-tabs")
    .getByRole("link", { name: "Charts", exact: true })
    .click();
  await page.getByRole("button", { name: "Log Scale", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Log Scale", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Chart from").fill("2020-01-01");
  await expect(page.getByRole("alert")).toContainText("end date");
  await open(page, "/coins/bitcoin/news/");
  await page.getByLabel("News Feeds", { exact: true }).selectOption("CNN");
  await expect(page.locator(".coin-news-list>a")).toHaveCount(2);
  await page.getByLabel("Exclude news category").selectOption("Blockchain");
  await expect(page.getByText("No news found.", { exact: true })).toBeVisible();
});
test("exchange filters and news categories change the original tables and cards", async ({
  page,
}) => {
  await open(page, "/exchanges/");
  await expect(page.locator(".exchange-table thead th")).toHaveCount(9);
  await page.getByLabel("Exchange volume").selectOption("large");
  expect(await page.locator(".exchange-table tbody tr").count()).toBeLessThan(
    15,
  );
  await open(page, "/exchanges/huobi/");
  await expect(
    page.getByRole("heading", { name: /Huobi/ }).first(),
  ).toBeVisible();
  await open(page, "/news/?category=ANALYSIS");
  await expect(page.getByLabel("News category")).toHaveValue("ANALYSIS");
  expect(await page.locator(".news-card").count()).toBeGreaterThan(3);
  await expect(page.locator(".news-card .news-photo span")).toHaveText(
    Array(await page.locator(".news-card").count()).fill("ANALYSIS"),
  );
  await page.getByLabel("Search news").fill("not-in-fixture");
  await expect(page.getByText("No news found.", { exact: true })).toBeVisible();
  await open(page, "/news/huobi-stablecoin/");
  await expect(
    page.getByRole("heading", { name: "Tether Not Listed among Stablecoins" }),
  ).toBeVisible();
});
test("buy checks funds and debits the correct fee once", async ({ page }) => {
  await open(page, "/app/buy/");
  await page.getByLabel("Amount TBCi", { exact: true }).fill("200");
  await page.getByRole("button", { name: "Review buy", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Insufficient USD");
  await page.getByLabel("Amount TBCi", { exact: true }).fill("-1");
  await expect(
    page.getByRole("button", { name: "Review buy", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Amount TBCi", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Review buy", exact: true }).click();
  await page.getByRole("button", { name: "Confirm buy", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Purchase completed", exact: true }),
  ).toBeVisible();
  expect((await stored(page)).tokenBalances["tbci-20-stable"]).toBe(2354);
  expect((await stored(page)).balances.USD).toBeCloseTo(
    5400.44 - price * 1.005,
    6,
  );
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.reload();
  await page.locator("h1").waitFor();
  expect((await stored(page)).operations).toHaveLength(1);
});
test("sell uses the selected receiving wallet and net fee", async ({
  page,
}) => {
  await open(page, "/app/sell/");
  const before = await stored(page);
  await page.getByLabel("Receive in", { exact: true }).selectOption("BTC");
  await page.getByLabel("Amount TBCi", { exact: true }).fill("2");
  await page.getByRole("button", { name: "Review sell", exact: true }).click();
  await page.getByRole("button", { name: "Confirm sell", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sale completed", exact: true }),
  ).toBeVisible();
  expect((await stored(page)).tokenBalances["tbci-20-stable"]).toBe(2351);
  expect((await stored(page)).balances.BTC).toBeCloseTo(
    before.balances.BTC + (2 * price * 0.995) / 6333.75,
    7,
  );
});
test("compile requires every component and processes all 20 atomically", async ({
  page,
}) => {
  await open(page, "/app/compile/");
  await expect(page.locator(".compile-table tbody tr")).toHaveCount(10);
  await expect(
    page.getByRole("button", { name: "Compile", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /^Calculate/ }).click();
  await expect(page.locator(".compile-table tbody tr")).toHaveCount(20);
  await expect(
    page.getByRole("button", { name: "Compile", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Amount TBCi", { exact: true }).fill("1");
  await page.getByRole("button", { name: /^Calculate/ }).click();
  await page.getByRole("button", { name: "Compile", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm compile", exact: true })
    .click();
  await expect.poll(async () => (await stored(page)).balances.TBCi).toBe(2354);
  expect((await stored(page)).operations).toHaveLength(1);
});
test("unmake withdraws individual claims without burning tokens twice, including reload", async ({
  page,
}) => {
  await open(page, "/app/unmake/");
  const before = await stored(page);
  await page.getByLabel("Amount TBCi", { exact: true }).fill("2");
  await page.getByRole("button", { name: /^Calculate/ }).click();
  await page
    .getByRole("button", { name: "Withdraw component BTC", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm withdrawal", exact: true })
    .click();
  await expect.poll(async () => (await stored(page)).balances.TBCi).toBe(2351);
  expect((await stored(page)).balances.BTC).toBeCloseTo(
    before.balances.BTC + (2 * price * 0.27 * 0.995) / 6333.75,
    7,
  );
  expect((await stored(page)).redemption.remaining.BTC).toBe(0);
  await page.reload();
  await page.locator("h1").waitFor();
  await expect(
    page.getByRole("button", { name: "Withdraw component BTC", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Withdraw all", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm unmake", exact: true })
    .click();
  await expect.poll(async () => (await stored(page)).redemption).toBeNull();
  expect((await stored(page)).balances.TBCi).toBe(2351);
  expect((await stored(page)).balances.ETH).toBeGreaterThan(
    before.balances.ETH,
  );
});
test("wallet deposit, withdrawal, complete asset list and multi-index portfolio", async ({
  page,
}) => {
  await open(page, "/app/wallets/");
  const before = await stored(page);
  await page.getByRole("button", { name: "Deposit BTC", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Amount, BTC", { exact: true }).fill(".1");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Confirm deposit", exact: true })
    .click();
  await expect
    .poll(async () => (await stored(page)).balances.BTC)
    .toBeCloseTo(before.balances.BTC + 0.1, 7);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.getByRole("button", { name: "Withdraw BTC", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Amount, BTC", { exact: true }).fill(".01");
  await page
    .getByRole("button", { name: "Fill recipient", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "I checked the address and selected network.",
    })
    .check();
  await page
    .getByRole("button", { name: "Confirm withdrawal", exact: true })
    .click();
  await expect
    .poll(async () => (await stored(page)).balances.BTC)
    .toBeCloseTo(before.balances.BTC + 0.09 - 0.00005, 7);
  await expect(
    page.getByRole("heading", { name: "Withdrawal completed", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Deposit IOTA", exact: true }),
  ).toBeVisible();
  await open(page, "/app/indices/");
  await expect(page.locator(".choice-card")).toHaveCount(7);
  await page
    .locator(".choice-card")
    .nth(1)
    .getByRole("button", { name: "Index Strategy Lab", exact: true })
    .click();
  await expect(page.locator("h1")).toHaveText(/^Index Strategy Lab TBCi/);
  await open(page, "/app/");
  await expect(page.locator(".owned-index-card")).toHaveCount(5);
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Overview");
});
test("composition history compares snapshots and holders paginate", async ({
  page,
}) => {
  await open(page, "/app/history/");
  await expect(page.locator(".history-tables table")).toHaveCount(2);
  await expect(page.locator(".changed-composition")).toHaveCount(2);
  const first = await page.locator(".history-tables").innerText();
  await page.getByRole("button", { name: /Next period/ }).click();
  await expect(page.locator(".history-tables")).not.toHaveText(first);
  await open(page, "/app/holders/");
  await expect(page.locator(".holders-list tbody tr")).toHaveCount(12);
  await page.getByRole("button", { name: /Next 100/ }).click();
  await expect(page.locator(".holders-list tbody tr")).toHaveCount(100);
  await page.getByRole("button", { name: "View All", exact: true }).click();
  await expect(page.locator(".holders-list tbody tr")).toHaveCount(212);
});
test("all source screens fit 320 and 375px, account drawer works", async ({
  page,
}) => {
  test.setTimeout(180000);
  const overflows: string[] = [];
  for (const width of [375, 320])
    for (const [path] of refs) {
      await page.setViewportSize({ width, height: 850 });
      await open(page, path);
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        width: innerWidth,
      }));
      if (size.scroll > size.width)
        overflows.push(path + " at " + width + ": " + size.scroll + "px");
    }
  expect(overflows).toEqual([]);
  await page.getByRole("button", { name: "Toggle account navigation" }).click();
  await expect(page.locator(".account-sidebar")).toHaveClass(/open/);
  await page.getByRole("button", { name: "Close account navigation" }).click();
  await page.screenshot({
    path: "test-results/account-mobile.png",
    fullPage: true,
  });
  await open(page, "/");
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
});
