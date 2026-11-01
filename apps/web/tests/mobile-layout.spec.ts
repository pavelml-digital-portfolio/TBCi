import { test, expect, type Page } from "@playwright/test";
const phoneWidths = [
  320, 344, 360, 375, 390, 393, 412, 430, 480, 540, 600, 677, 767, 800,
];
async function fits(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    )
    .toBe(true);
}
async function settled(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      ),
  );
}
test("public mobile menu stays inside the viewport, receives touches and dismisses", async ({
  browser,
}) => {
  const context = await browser.newContext({
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  for (const width of phoneWidths) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto("/coins/");
    await page.getByLabel("Open navigation").tap();
    const menu = page.getByRole("navigation", { name: "Mobile navigation" });
    await expect(menu).toBeVisible();
    const bounds = await menu.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
    await expect(
      menu.getByRole("link", { name: "Login / Register", exact: true }),
    ).toBeInViewport();
    expect(
      await menu
        .getByRole("link", { name: "Coins", exact: true })
        .evaluate((e) => {
          const r = e.getBoundingClientRect();
          return e.contains(
            document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
          );
        }),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await page.getByLabel("Open navigation").tap();
    await page.touchscreen.tap(width - 3, 120);
    await expect(menu).toBeHidden();
    await fits(page);
  }
  await page.getByLabel("Open navigation").tap();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "News", exact: true })
    .tap();
  await expect(page).toHaveURL(/\/news\/$/);
  await context.close();
});
test("hero index controls and periods never overlap, including landscape", async ({
  page,
}) => {
  await page.goto("/");
  for (const viewport of [
    ...phoneWidths.map((width) => ({ width, height: 852 })),
    { width: 667, height: 375 },
    { width: 812, height: 375 },
    { width: 932, height: 430 },
    { width: 1024, height: 600 },
    { width: 1100, height: 700 },
    { width: 1101, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await settled(page);
    await fits(page);
    const boxes = await page
      .locator(".hero-index-buttons > button,.hero-index-buttons > details")
      .evaluateAll((es) =>
        es.map((e) => {
          const r = e.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        }),
      );
    for (const button of await page
      .locator(".trading-hero-controls button")
      .all()) {
      const p = (await button.boundingBox())!;
      for (const box of boxes)
        expect(
          Math.min(p.x + p.width, box.right) <= Math.max(p.x, box.left) + 1 ||
            Math.min(p.y + p.height, box.bottom) <= Math.max(p.y, box.top) + 1,
        ).toBe(true);
    }
    for (const button of await page
      .locator(".trading-hero-controls button")
      .all())
      await expect(button).toBeInViewport();
  }
  await page.setViewportSize({ width: 393, height: 852 });
  await page
    .getByRole("button", { name: "TBCi-10 Stable", exact: true })
    .click();
  await expect(page.locator(".home-hero h1")).toContainText("10 Stable");
  await page
    .locator(".trading-hero-controls")
    .getByRole("button", { name: "1M", exact: true })
    .click();
  await expect(
    page
      .locator(".trading-hero-controls")
      .getByRole("button", { name: "1M", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator(".hero-index-buttons summary").click();
  await expect(page.locator(".hero-index-buttons .dropdown")).toBeVisible();
});
test("lab chart height remains bounded over time, settings changes and orientation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/app/strategy-lab/");
  const charts = page.locator(".lab-chart-canvas");
  await expect(charts).toHaveCount(2);
  await expect(page.locator(".lab-comparison-chart").first()).toHaveAttribute(
    "data-ready",
    "true",
  );
  const heights = () =>
    charts.evaluateAll((elements) =>
      elements.map((e) => e.getBoundingClientRect().height),
    );
  expect(await heights()).toEqual([280, 280]);
  // ResizeObserver feedback grew the original chart by ~380px in four seconds.
  await page.waitForTimeout(4500);
  expect(await heights()).toEqual([280, 280]);
  for (const width of [320, 375, 430, 600, 767, 768, 932, 1440, 393]) {
    await page.setViewportSize({ width, height: width > 767 ? 430 : 852 });
    await settled(page);
    expect(await heights()).toEqual(width < 768 ? [280, 280] : [380, 380]);
    await fits(page);
  }
  await page
    .locator(".lab-comparison-chart")
    .first()
    .getByLabel("Chart type")
    .selectOption("Line");
  await settled(page);
  expect(await heights()).toEqual([280, 280]);
  await page.locator(".lab-settings summary").click();
  await page.getByLabel("Backtest period").selectOption("90");
  await settled(page);
  expect(await heights()).toEqual([280, 280]);
});
test("index summary separates its timestamp, values and currency selector on phones", async ({
  page,
}) => {
  await page.goto("/app/holders/");
  for (const width of phoneWidths.filter((w) => w < 768)) {
    await page.setViewportSize({ width, height: 852 });
    await settled(page);
    await fits(page);
    const time = await page.locator(".summary-change small").boundingBox(),
      values = await page.locator(".summary-change > div").boundingBox();
    expect(values!.y).toBeGreaterThanOrEqual(time!.y + time!.height - 1);
    const currency = page.getByLabel("Token equivalent currency");
    await currency.selectOption("ETH");
    const selector = await currency.boundingBox();
    expect(selector!.height).toBeGreaterThanOrEqual(36);
    expect(
      await page
        .locator(".token-summary")
        .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
    ).toBe(true);
  }
});

test("trading, funding, security and verification dialogs fit phone and landscape viewports", async ({
  page,
}) => {
  test.setTimeout(120000);
  const viewports = [
    ...phoneWidths.map((width) => ({ width, height: 740 })),
    { width: 667, height: 320 },
    { width: 844, height: 390 },
    { width: 932, height: 430 },
  ];
  const open = async (path: string) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(path);
    await page.locator("h1").waitFor();
  };
  const inspect = async () => {
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await settled(page);
      const r = (await dialog.boundingBox())!;
      expect(r.x).toBeGreaterThanOrEqual(-1);
      expect(r.x + r.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(r.y).toBeGreaterThanOrEqual(-1);
      expect(r.y + r.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(
        await dialog.evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      ).toBe(true);
      await expect(
        page.getByRole("button", { name: "Close dialog", exact: true }),
      ).toBeInViewport();
    }
    await page.setViewportSize({ width: 393, height: 852 });
  };
  const close = async () =>
    page.getByRole("button", { name: "Close dialog", exact: true }).click();
  for (const type of ["buy", "sell"]) {
    await open("/app/?trade=" + type + "&index=tbci-20-stable");
    await inspect();
    await close();
  }
  await open("/app/wallets/");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await inspect();
  await close();
  await page
    .getByRole("button", { name: "Actions for BTC", exact: true })
    .click();
  await page.getByRole("button", { name: "Deposit BTC", exact: true }).click();
  await inspect();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator(".wallet-qr img").waitFor();
  await inspect();
  await close();
  await page
    .getByRole("button", { name: "Actions for BTC", exact: true })
    .click();
  await page.getByRole("button", { name: "Withdraw BTC", exact: true }).click();
  await inspect();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Fill recipient", exact: true })
    .click();
  await page.getByLabel("Amount, BTC", { exact: true }).fill(".01");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await inspect();
  await close();
  await open("/app/settings/#verification");
  await page.getByRole("button", { name: /Upgrade to Level 3/ }).click();
  await inspect();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Use saved document", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Complete selfie check", exact: true })
    .click();
  await inspect();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Use saved document", exact: true })
    .click();
  await inspect();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await inspect();
  await close();
  await open("/app/settings/#security");
  await page.getByRole("button", { name: "Set up 2FA", exact: true }).click();
  await inspect();
  await close();
  await open("/app/settings/#whitelist");
  await page.getByRole("button", { name: "Add address", exact: true }).click();
  await inspect();
  await close();
});
