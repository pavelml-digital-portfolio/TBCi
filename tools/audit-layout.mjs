import { chromium } from "@playwright/test";
import fs from "node:fs";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:4336";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const routes = [
  "/",
  "/index/tbci-20-balance/",
  "/coins/",
  "/coins/bitcoin/",
  "/coins/bitcoin/charts/",
  "/coins/bitcoin/historical-price/",
  "/coins/bitcoin/markets/",
  "/coins/bitcoin/news/",
  "/exchanges/",
  "/exchanges/huobi/",
  "/news/",
  "/news/huobi-stablecoin/",
  "/app/wallets/",
  "/app/indices/",
  "/app/",
  "/app/buy/",
  "/app/compile/",
  "/app/sell/",
  "/app/unmake/",
  "/app/history/",
  "/app/holders/",
  "/ico/",
  "/ico/pundi-x/",
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
const widths = [320, 375, 677, 768, 1024, 1280, 1496, 1920, 2560];
const results = [];
fs.mkdirSync("docs/frontend/screens/flows", { recursive: true });
for (const width of widths) {
  await page.setViewportSize({ width, height: 1000 });
  for (const route of routes) {
    await page.goto(base + route);
    if (/^\/app\/(buy|sell)\//.test(route)) {
      await page.waitForURL((u) => u.pathname === "/app/");
      await page.getByRole("dialog").waitFor();
    }
    await page.locator("h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    const chart = page.locator(".trading-widget").first();
    if (await chart.count()) await chart.locator("canvas").first().waitFor();
    const check = await page.evaluate(() => {
      const width = innerWidth;
      const box = (e) => {
        const r = e.getBoundingClientRect();
        return {
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
          width: r.width,
          height: r.height,
        };
      };
      const overlap = (a, b) =>
        Math.min(a.right, b.right) > Math.max(a.left, b.left) + 1 &&
        Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top) + 1;
      const collisions = [];
      for (const row of document.querySelectorAll(
        ".settings-devices>article",
      )) {
        const info = row.querySelector("div"),
          action = row.lastElementChild;
        if (info && action && overlap(box(info), box(action)))
          collisions.push("Device details overlap action");
      }
      for (const card of document.querySelectorAll(".owned-index-card")) {
        const title = card.querySelector("h3"),
          balance = card.querySelector(".owned-index-balance"),
          actions = card.querySelector(".owned-index-actions"),
          spark = card.querySelector(".sparkline");
        if (title && balance && overlap(box(title), box(balance)))
          collisions.push("Index title overlaps balance");
        if (actions && spark && overlap(box(actions), box(spark)))
          collisions.push("Index actions overlap sparkline");
      }
      const search = document.querySelector(".header-search>button");
      if (search && box(search).width) {
        const icon = search.querySelector("svg");
        if (
          icon &&
          Math.abs(
            (box(search).top +
              box(search).bottom -
              box(icon).top -
              box(icon).bottom) /
              2,
          ) > 1
        )
          collisions.push("Search icon is not centered");
      }
      const overflow = [
        ...document.querySelectorAll(
          ".portfolio-totals,.portfolio-panel,.owned-index-card,.asset-wallet-table,.settings-card,.settings-devices>article,.interactive-donut,.faq",
        ),
      ]
        .filter((e) => {
          const b = box(e);
          return b.width && b.left >= 0 && b.right > width + 0.5;
        })
        .map((e) =>
          typeof e.className === "string" ? e.className : e.tagName,
        );
      const dialog = document.querySelector("dialog[open]");
      if (
        dialog &&
        (dialog.scrollWidth > dialog.clientWidth + 1 ||
          box(dialog).right > width + 0.5 ||
          box(dialog).left < -0.5)
      )
        overflow.push("dialog");
      return {
        width,
        scroll: document.documentElement.scrollWidth,
        collisions,
        overflow,
      };
    });
    results.push({ route, ...check });
    if (
      [375, 1496, 2560].includes(width) &&
      [
        "/",
        "/app/",
        "/app/wallets/",
        "/app/settings/#verification",
        "/app/settings/#security",
        "/app/settings/#devices",
        "/app/help/",
      ].includes(route)
    ) {
      const name =
        route === "/" ? "home" : route.replaceAll("/", "-").replace("#", "-");
      await page.screenshot({
        path: "docs/frontend/screens/flows/" + name + "-" + width + ".png",
        fullPage: true,
      });
    }
  }
  console.log("Checked width", width);
}
const report = {
  generatedAt: new Date().toISOString(),
  viewports: widths,
  checks: results.length,
  issues: results.filter(
    (r) => r.scroll > r.width || r.collisions.length || r.overflow.length,
  ),
  runtimeErrors: errors,
  results,
};
fs.writeFileSync(
  "docs/frontend/LAYOUT_REVIEW.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    { checks: report.checks, issues: report.issues, runtimeErrors: errors },
    null,
    2,
  ),
);
await browser.close();
if (report.issues.length || errors.length) process.exitCode = 1;
