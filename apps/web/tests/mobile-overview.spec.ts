import { test, expect } from "@playwright/test";

test("mobile Overview carousels navigate, preserve trading and reveal advanced chart options", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/app/");
  await expect(page.locator("h1")).toHaveText("Overview");
  const indices = page.getByRole("region", {
    name: "Your indices",
    exact: true,
  });
  await expect(
    indices.locator(".mobile-carousel-dots button").nth(0),
  ).toHaveAttribute("aria-current", "true");
  await indices.locator(".mobile-carousel-dots button").nth(1).click();
  await expect(
    indices.locator(".mobile-carousel-dots button").nth(1),
  ).toHaveAttribute("aria-current", "true");
  const track = indices.locator(".mobile-carousel-track");
  await track.focus();
  await page.keyboard.press("End");
  await expect(
    indices.locator(".mobile-carousel-dots button").nth(4),
  ).toHaveAttribute("aria-current", "true");
  await expect(
    indices.getByRole("button", {
      name: "Next slide: Your indices",
      exact: true,
    }),
  ).toHaveCount(0);
  await indices
    .getByRole("button", { name: "Sell TBCi-20 Utility", exact: true })
    .click();
  await expect(page.getByLabel("Index", { exact: true })).toHaveValue(
    "tbci-20-utility",
  );
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();

  const chart = page.locator(".trading-compact");
  await expect(chart.getByLabel("Chart type", { exact: true })).toBeVisible();
  await expect(
    chart.getByLabel("Chart interval", { exact: true }),
  ).toBeVisible();
  await expect(chart.getByLabel("Chart from", { exact: true })).toBeHidden();
  const options = chart.getByRole("button", {
    name: "Chart options",
    exact: true,
  });
  await options.click();
  await expect(options).toHaveAttribute("aria-expanded", "true");
  await expect(chart.getByLabel("Chart from", { exact: true })).toBeVisible();
  await chart.getByRole("button", { name: "SMA 20", exact: true }).click();
  await options.click();
  await expect(chart.getByLabel("Chart from", { exact: true })).toBeHidden();
  await options.click();
  await expect(
    chart.getByRole("button", { name: "SMA 20", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await options.click();

  const insights = page.getByRole("region", {
    name: "Portfolio insights",
    exact: true,
  });
  await insights.locator(".mobile-carousel-dots button").nth(1).click();
  await expect(
    insights.locator(".mobile-carousel-dots button").nth(1),
  ).toHaveAttribute("aria-current", "true");
  await insights.locator('.exposure-map [role="button"]').first().click();
  await expect(
    insights.locator(".exposure-map .portfolio-chart-detail"),
  ).toContainText("exposure");
  await insights.locator(".mobile-carousel-dots button").nth(2).click();
  await expect(
    insights.locator(".mobile-carousel-dots button").nth(2),
  ).toHaveAttribute("aria-current", "true");
  await expect(insights.locator(".portfolio-activity")).toContainText(
    "No index trades yet",
  );
  // The viewport follows the selected slide rather than reserving the height of all panels.
  expect(
    await insights
      .locator(".mobile-carousel-track")
      .evaluate((e) => e.clientHeight),
  ).toBeLessThan(400);
  for (const width of [320, 375, 430, 600, 677, 767, 768, 1496]) {
    await page.setViewportSize({ width, height: 850 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
  await expect(options).toBeHidden();
  await expect(
    page.locator('.account-sidebar nav a[href="/app/settings/"]'),
  ).toHaveCount(0);
  await page.locator(".sidebar-user").click();
  await expect(page.locator("h1")).toHaveText("Settings");
});

test("mobile Wallet separates index slides from currency rows and keeps funding actions available", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("/app/wallets/");
  await expect(page.locator("h1")).toHaveText("Wallet");
  const indices = page.getByRole("region", {
    name: "Wallet indices",
    exact: true,
  });
  await expect(indices.locator(".wallet-index-card")).toHaveCount(7);
  await page
    .getByRole("checkbox", { name: "Hide zero balances", exact: true })
    .check();
  await expect(indices.locator(".wallet-index-card")).toHaveCount(5);
  await indices.locator(".mobile-carousel-dots button").nth(1).click();
  await expect(
    indices.locator(".mobile-carousel-dots button").nth(1),
  ).toHaveAttribute("aria-current", "true");
  for (const width of [320, 375, 430, 600, 677, 767]) {
    await page.setViewportSize({ width, height: 850 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    expect(
      await page
        .locator(".asset-wallet-table")
        .evaluate((e) => getComputedStyle(e).display),
    ).toBe("table");
    expect(
      await page
        .locator('[data-asset="BTC"]')
        .evaluate((e) => getComputedStyle(e).display),
    ).toBe("table-row");
    await expect(
      page.locator('.asset-wallet-table [data-kind="index"]').first(),
    ).toBeHidden();
  }
  await page.setViewportSize({ width: 375, height: 850 });
  await page.getByRole("button", { name: /^Crypto/ }).click();
  await expect(indices).toHaveCount(0);
  await page.getByLabel("Search wallet assets").fill("BTC");
  await expect(page.locator(".asset-wallet-table tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Actions for BTC", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Available");
  await page.getByRole("button", { name: "Deposit BTC", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Deposit BTC");
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByLabel("Search wallet assets").fill("");
  await page.getByRole("button", { name: /^Indices/ }).click();
  await expect(page.locator(".asset-wallet-table")).toBeHidden();
  await page
    .getByRole("region", { name: "Wallet indices", exact: true })
    .getByRole("link", { name: "Buy", exact: true })
    .first()
    .click();
  await expect(page.locator("h1")).toHaveText("Overview");
  await expect(page.getByRole("dialog")).toBeVisible();
});
