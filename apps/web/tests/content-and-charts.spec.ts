import { seriesFor, rsi, profiles } from "../src/data/market";
import articles from "../src/data/articles.json" with { type: "json" };
import projects from "../src/data/ico-2018.json" with { type: "json" };
import { test, expect, type Page } from "@playwright/test";
const open = async (page: Page, path: string) => {
  await page.goto(path);
  await page.locator("h1").waitFor();
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
};
test("canvas charts support OHLC, real zoom, indicators, comparisons and exports", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "/app/");
  const chart = page.locator(".trading-widget").first();
  await expect(chart).toHaveAttribute("data-ready", "true");
  await expect(chart.locator("canvas")).not.toHaveCount(0);
  await chart.getByLabel("Chart type", { exact: true }).selectOption("Candles");
  await chart.getByLabel("Chart interval", { exact: true }).selectOption("4H");
  await chart.getByRole("button", { name: "1M", exact: true }).click();
  await expect(chart.getByLabel("Chart from", { exact: true })).toHaveValue(
    "2018-12-01",
  );
  await expect(chart).toHaveAttribute("data-ready", "true");
  const initial = Number(
    (await chart.getByLabel("Visible chart bars").innerText()).split(" ")[0],
  );
  await chart.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect
    .poll(async () =>
      Number(
        (await chart.getByLabel("Visible chart bars").innerText()).split(
          " ",
        )[0],
      ),
    )
    .toBeLessThan(initial);
  await chart
    .getByRole("button", { name: "Reset chart zoom", exact: true })
    .click();
  await expect
    .poll(async () =>
      Number(
        (await chart.getByLabel("Visible chart bars").innerText()).split(
          " ",
        )[0],
      ),
    )
    .toBeGreaterThan(initial - 8);
  for (const name of ["Volume", "SMA 20", "EMA 50", "Bollinger", "RSI 14"]) {
    await chart.getByRole("button", { name, exact: true }).click();
    await expect(
      chart.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }
  await chart.getByLabel("Add coins to comparison").fill("ETH");
  await chart
    .getByRole("button", { name: "Add comparison", exact: true })
    .click();
  await expect(
    chart.getByRole("button", { name: "Remove ETH comparison" }),
  ).toBeVisible();
  await chart
    .getByRole("button", { name: "Price level +", exact: true })
    .click();
  await expect(
    chart.getByRole("status", { name: "Chart notification" }),
  ).toContainText("Price level added");
  await chart
    .getByRole("button", { name: "Clear levels", exact: true })
    .click();
  await chart.getByRole("button", { name: "Show data", exact: true }).click();
  await expect(chart.locator("tbody tr")).toHaveCount(30);
  const csvEvent = page.waitForEvent("download");
  await chart.getByRole("button", { name: "CSV", exact: true }).click();
  expect((await csvEvent).suggestedFilename()).toMatch(/2018\.csv$/);
  const pngEvent = page.waitForEvent("download");
  await chart.getByRole("button", { name: "PNG", exact: true }).click();
  expect((await pngEvent).suggestedFilename()).toMatch(/2018\.png$/);
  await chart
    .getByLabel("Chart metric", { exact: true })
    .selectOption("Return %");
  await expect(
    chart.getByRole("button", { name: "Log Scale", exact: true }),
  ).toBeDisabled();
  await chart.getByLabel("Interactive chart canvas.", { exact: false }).focus();
  await page.keyboard.press("ArrowRight");
  expect(errors).toEqual([]);
});
test("different indices have different complete series, not scaled copies", async ({
  page,
}) => {
  await open(page, "/index/tbci-20-balance/");
  const chart = page.locator(".trading-widget").first();
  await chart.getByRole("button", { name: "Show data", exact: true }).click();
  const first = await chart.locator("tbody tr").allTextContents();
  await chart
    .getByLabel("Main chart series", { exact: true })
    .selectOption("tbci-50-active");
  await expect(chart).toHaveAttribute("data-instrument", "tbci-50-active");
  const second = await chart.locator("tbody tr").allTextContents();
  expect(second).not.toEqual(first);
  await chart
    .getByLabel("Main chart series", { exact: true })
    .selectOption("tbci-20-utility");
  await expect(chart.locator("tbody tr")).not.toHaveText(second);
  await chart.getByRole("button", { name: "1W", exact: true }).click();
  await expect(chart.getByLabel("Chart from")).toHaveValue("2018-12-25");
  expect(await chart.locator("tbody tr").count()).toBe(7);
});
test("archive has substantial articles, relevant links and working month/search filters", async ({
  page,
}) => {
  await open(page, "/news/");
  await expect(
    page.getByText("32 articles · January–December 2018"),
  ).toBeVisible();
  await expect(page.locator(".news-grid .news-card")).toHaveCount(9);
  await page
    .getByRole("button", { name: "View More News", exact: true })
    .click();
  await expect(page.locator(".news-grid .news-card")).toHaveCount(18);
  const links = await page
    .locator(".featured-card")
    .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(new Set(links).size).toBe(3);
  await page.getByLabel("News month", { exact: true }).selectOption("01");
  await expect(page.locator(".news-card")).toHaveCount(1);
  await page.locator(".news-card").first().click();
  await expect(page.locator(".article-body")).toContainText("interoperability");
  const words = (await page.locator(".article-body").innerText()).split(
    /\s+/,
  ).length;
  expect(words).toBeGreaterThan(350);
  await page
    .getByRole("button", { name: "☆ Save article", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "★ Saved", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".related-news .news-card")).toHaveCount(3);
  await expect(page.locator("time[datetime]")).toHaveAttribute(
    "datetime",
    /^2018-/,
  );
});
test("ICO calendar is confined to 2018 and supports months, days, sources and watchlist", async ({
  page,
}) => {
  await open(page, "/ico/");
  await expect(
    page.getByRole("heading", { name: "ICO calendar", exact: true }),
  ).toBeVisible();
  const month = page.getByLabel("ICO month", { exact: true });
  await month.selectOption("0");
  await expect(
    page.getByRole("button", { name: "Previous ICO month" }),
  ).toBeDisabled();
  await expect(page.locator(".ico-table tbody")).toContainText("Pundi X");
  await page
    .getByRole("button", { name: /Calendar/, exact: false })
    .filter({ hasText: "Calendar" })
    .click();
  await expect(page.locator(".ico-day")).toHaveCount(31);
  await page.getByRole("button", { name: /21 Jan 2018,/ }).click();
  await expect(page.locator(".ico-results")).toContainText("21 Jan 2018");
  await page
    .getByRole("button", { name: "Watch Pundi X", exact: true })
    .click();
  await page.reload();
  await month.selectOption("0");
  await expect(
    page.getByRole("button", { name: "Watch Pundi X", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: /Pundi X/ }).click();
  await expect(page.locator(".ico-facts")).toContainText("21 Jan 2018");
  await expect(page.locator(".ico-allocation")).toContainText(
    "Token allocation",
  );
  await expect(
    page.getByRole("link", { name: /Archived ICObench CSV/ }),
  ).toHaveAttribute("href", /github\.com\/earlvanze/);
  await open(page, "/ico/");
  await month.selectOption("11");
  await expect(
    page.getByRole("button", { name: "Next ICO month" }),
  ).toBeDisabled();
  await page.getByLabel("Search ICO", { exact: true }).fill("no-such-project");
  await expect(
    page.getByText("No ICO listings match this month and these filters."),
  ).toBeVisible();
});
test("coin sections have distinct useful content and vector icons load locally", async ({
  page,
}) => {
  for (const tab of ["analysis", "trades", "forum", "timeline"]) {
    await open(page, "/coins/ethereum/" + tab + "/");
    await expect(page.getByText("Not supplied", { exact: true })).toHaveCount(
      0,
    );
    if (tab === "trades") {
      await page.getByRole("button", { name: "Buy", exact: true }).click();
      await expect(
        page.locator(".mock-trades tbody tr td:nth-child(2)"),
      ).toHaveText(
        Array(await page.locator(".mock-trades tbody tr").count()).fill("Buy"),
      );
    }
    if (tab === "forum") {
      await page.getByLabel("Sort discussions").selectOption("Most replies");
      await page.locator(".community-threads button").first().click();
    }
  }
  for (const [slug, symbol] of [
    ["bitcoin-cash", "BCH"],
    ["cardano", "ADA"],
    ["monero", "XMR"],
  ]) {
    await open(page, "/coins/" + slug + "/");
    await expect(
      page.getByLabel("Main chart series", { exact: true }),
    ).toHaveValue(symbol);
  }
  await open(page, "/coins/");
  const images = page.locator(".currency-table img.crypto-icon");
  expect(await images.count()).toBeGreaterThan(10);
  expect(
    await images.evaluateAll((els) =>
      els.every(
        (e) =>
          e instanceof HTMLImageElement &&
          e.src.includes("/coins/svg/") &&
          e.complete &&
          e.naturalWidth > 0,
      ),
    ),
  ).toBeTruthy();
});
test("large portfolio balances, trade controls and public pages fit all widths", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 375, 768, 1024, 1280, 1496, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    await open(page, "/app/");
    await page.evaluate(() => {
      const key = "tbci-reference-demo-v2",
        s = JSON.parse(localStorage.getItem(key)!);
      s.tokenBalances["tbci-50-active"] = 123456789;
      localStorage.setItem(key, JSON.stringify(s));
    });
    await page.reload();
    await page.locator("h1").waitFor();
    for (const currency of ["USD", "BTC", "ETH"]) {
      await page
        .getByLabel("Display currency", { exact: true })
        .selectOption(currency);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Portfolio overflow " + width + " " + currency,
      ).toBe(true);
    }
    await page
      .getByRole("button", { name: "Sell TBCi-50 Active", exact: true })
      .click();
    await page.getByLabel("Amount TBCi", { exact: true }).fill("1000000");
    const rect = await page
      .getByRole("dialog")
      .evaluate((e) => ({ scroll: e.scrollWidth, width: e.clientWidth }));
    expect(rect.scroll).toBeLessThanOrEqual(rect.width + 1);
    await page
      .getByRole("button", { name: "Close dialog", exact: true })
      .click();
    for (const path of [
      "/ico/",
      "/ico/quarkchain/",
      "/news/bitcoin-core-017/",
      "/coins/ethereum/analysis/",
    ]) {
      await open(page, path);
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        path + " overflow at " + width,
      ).toBeTruthy();
    }
  }
  expect(errors).toEqual([]);
});

test("historical fixtures have valid 2018 dates, OHLC ranges and independent index returns", () => {
  for (const id of Object.keys(profiles)) {
    const rows = seriesFor(id);
    expect(rows).toHaveLength(365);
    for (let i = 0; i < rows.length; i++) {
      const b = rows[i];
      expect(new Date(b.time * 1000).getUTCFullYear()).toBe(2018);
      expect(b.high).toBeGreaterThanOrEqual(Math.max(b.open, b.close));
      expect(b.low).toBeLessThanOrEqual(Math.min(b.open, b.close));
      expect(b.low).toBeGreaterThan(0);
      expect(b.volume).toBeGreaterThan(0);
      if (i) expect(b.time).toBeGreaterThan(rows[i - 1].time);
    }
    for (const p of rsi(rows))
      expect(p.value >= 0 && p.value <= 100).toBeTruthy();
  }
  const a = seriesFor("tbci-10-stable"),
    b = seriesFor("tbci-50-active");
  const different = a
    .slice(1)
    .filter(
      (r, i) =>
        Math.abs(r.close / a[i].close - b[i + 1].close / b[i].close) > 0.0001,
    ).length;
  expect(different).toBeGreaterThan(300);
  expect(seriesFor("BTC", "1H")).toHaveLength(8760);
  for (const p of projects) {
    expect(p.start).toMatch(/^2018-/);
    expect(p.end).toMatch(/^2018-/);
    expect(p.start <= p.end).toBeTruthy();
    expect(p.allocation.reduce((s, a) => s + a.share, 0)).toBe(100);
  }
  for (const n of articles) {
    expect(n.publishedAt).toMatch(/^2018-/);
    expect(
      (
        n.summary +
        " " +
        n.sections.flatMap((s) => s.paragraphs).join(" ")
      ).split(/\s+/).length,
    ).toBeGreaterThan(350);
  }
});
