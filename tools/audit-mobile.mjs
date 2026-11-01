import { chromium, expect } from "@playwright/test";
import fs from "node:fs";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:4338";
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
});
const context = await browser.newContext({
  viewport: { width: 393, height: 852 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const page = await context.newPage();
const runtimeErrors = [];
page.on("pageerror", (e) => runtimeErrors.push(e.message));
const routes = [
  "/",
  "/index/tbci-20-balance/",
  "/coins/",
  "/coins/bitcoin/",
  ...[
    "charts",
    "historical-price",
    "markets",
    "analysis",
    "trade",
    "news",
    "forum",
    "timeline",
  ]
    .filter((t) => t !== "trade")
    .map((t) => "/coins/bitcoin/" + t + "/"),
  "/coins/bitcoin/trades/",
  "/exchanges/",
  "/exchanges/huobi/",
  "/news/",
  "/news/bitcoin-core-017/",
  "/ico/",
  "/ico/quarkchain/",
  "/privacy/",
  "/app/",
  "/app/wallets/",
  "/app/indices/",
  "/app/strategy-lab/",
  "/app/compile/",
  "/app/unmake/",
  "/app/history/",
  "/app/holders/",
  "/app/help/",
  ...[
    "profile",
    "verification",
    "preferences",
    "security",
    "whitelist",
    "transfers",
    "activity",
    "devices",
  ].map((t) => "/app/settings/#" + t),
];
const widths = [
  320, 344, 360, 375, 390, 393, 412, 430, 480, 540, 600, 677, 767, 768, 800,
];
const landscapes = [
  { width: 568, height: 320 },
  { width: 667, height: 375 },
  { width: 740, height: 360 },
  { width: 812, height: 375 },
  { width: 844, height: 390 },
  { width: 932, height: 430 },
  { width: 1024, height: 600 },
];
const issues = [];
let cases = 0,
  pixelCases = 0;
const snapshots = [];
async function open(route) {
  await page.goto(base + route);
  await page.locator("h1").waitFor();
  await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}
async function inspect(kind, route, width, height) {
  const errors = await page.evaluate(async () => {
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
    const errors = [],
      bounds = (e) => e.getBoundingClientRect(),
      visible = (e) =>
        e.getClientRects().length && bounds(e).width && bounds(e).height;
    const overlap = (a, b) =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    if (document.documentElement.scrollWidth > innerWidth + 1)
      errors.push("Page overflow: " + document.documentElement.scrollWidth);
    for (const selector of [
      ".header-inner",
      ".token-summary",
      ".lab-panel",
      ".account-page-title",
      ".wallet-filters",
      ".settings-card",
      ".trading-widget",
      ".faq",
      ".wallet-modal",
    ])
      for (const e of document.querySelectorAll(selector)) {
        if (!visible(e)) continue;
        const r = bounds(e);
        if (r.left < -0.5 || r.right > innerWidth + 0.5)
          errors.push(selector + " outside viewport");
      }
    const periods = [
      ...document.querySelectorAll(".trading-hero-controls button"),
    ];
    for (const tab of document.querySelectorAll(
      ".hero-index-buttons > button,.hero-index-buttons > details",
    ))
      for (const period of periods)
        if (overlap(bounds(tab), bounds(period)))
          errors.push("Index tabs overlap periods");
    for (const selector of [
      ".trading-periods",
      ".trading-main-controls",
      ".summary-change",
      ".lab-chart-legend",
    ])
      for (const group of document.querySelectorAll(selector)) {
        const children = [...group.children].filter(visible);
        for (let i = 0; i < children.length; i++)
          for (let j = i + 1; j < children.length; j++)
            if (overlap(bounds(children[i]), bounds(children[j])))
              errors.push(selector + " children overlap");
      }
    for (const e of document.querySelectorAll(".lab-chart-canvas")) {
      const r = bounds(e);
      const expected = innerWidth < 768 ? 280 : 380;
      if (Math.abs(r.height - expected) > 1)
        errors.push("Unstable chart height " + r.height);
      if (e.scrollHeight > expected + 2)
        errors.push("Chart children exceed container");
    }
    const nav = document.querySelector(".mobile-public-menu[open] nav");
    if (nav) {
      const r = bounds(nav);
      if (r.left < 0 || r.right > innerWidth) errors.push("Menu offscreen");
    }
    return [...new Set(errors)];
  });
  cases++;
  if (kind === "pixel") pixelCases++;
  if (errors.length) issues.push({ kind, route, width, height, errors });
}
fs.mkdirSync("docs/frontend/screens/mobile-audit", { recursive: true });
for (const route of routes) {
  await open(route);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 852 });
    await inspect("route", route, width, 852);
  }
  for (const viewport of landscapes) {
    await page.setViewportSize(viewport);
    await inspect("landscape", route, viewport.width, viewport.height);
  }
}
console.log("All page templates and settings tabs checked:", cases);
for (const route of [
  "/",
  "/coins/",
  "/app/holders/",
  "/app/strategy-lab/",
  "/app/wallets/",
  "/app/settings/#security",
]) {
  await open(route);
  for (let width = 320; width <= (route === "/" ? 1280 : 800); width++) {
    await page.setViewportSize({ width, height: 852 });
    if (route === "/coins/")
      await page
        .locator(".mobile-public-menu")
        .evaluate((e) => (e.open = true));
    await inspect("pixel", route, width, 852);
  }
  console.log("Continuous width sweep complete:", route);
}
for (const width of [320, 393, 767]) {
  await page.setViewportSize({ width, height: 852 });
  for (const [route, name] of [
    ["/", "home"],
    ["/coins/", "menu"],
    ["/app/holders/", "holders"],
    ["/app/strategy-lab/", "lab"],
  ]) {
    await open(route);
    if (name === "menu") await page.getByLabel("Open navigation").click();
    if (name === "lab")
      await expect(
        page.locator(".lab-comparison-chart").first(),
      ).toHaveAttribute("data-ready", "true");
    const file = `docs/frontend/screens/mobile-audit/${name}-${width}.png`;
    await page.screenshot({ path: file, fullPage: true });
    snapshots.push(file);
  }
}
await browser.close();
const report = {
  generatedAt: new Date().toISOString(),
  browser: "Chromium, touch emulation, DPR 2",
  routes,
  widths,
  landscapes,
  continuousWidthRange: [320, 800],
  homeWidthRange: [320, 1280],
  cases,
  pixelCases,
  issues,
  runtimeErrors,
  snapshots,
};
fs.writeFileSync(
  "docs/frontend/MOBILE_REVIEW.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify({ cases, pixelCases, issues, runtimeErrors }, null, 2),
);
if (issues.length || runtimeErrors.length) process.exitCode = 1;
